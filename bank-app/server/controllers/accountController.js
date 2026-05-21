import PDFDocument from 'pdfkit';
import BankAccount from '../models/BankAccount.js';
import Transaction from '../models/Transaction.js';
import LedgerEntry from '../models/LedgerEntry.js';
import * as audit  from '../services/auditService.js';

const round2 = (n) => Math.round(n * 100) / 100;

// ── GET /api/accounts ─────────────────────────────────────────────
export async function getAccounts(req, res, next) {
  try {
    const accounts = await BankAccount.find({ user: req.user._id, status: { $ne: 'closed' } })
      .sort({ isPrimary: -1, createdAt: 1 });
    return res.status(200).json({ success: true, data: accounts });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/accounts/:id/transactions ────────────────────────────
// Query params: page, limit, search, category, type, status, fromDate, toDate, minAmount, maxAmount
export async function getAccountTransactions(req, res, next) {
  try {
    const userId = req.user._id;
    const account = await BankAccount.findOne({ _id: req.params.id, user: userId });
    if (!account) return res.status(404).json({ success: false, message: 'Account not found.' });

    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(100, parseInt(req.query.limit) || 25);
    const skip  = (page - 1) * limit;

    const filter = { account: account._id };
    if (req.query.type)     filter.type     = req.query.type;
    if (req.query.status)   filter.status   = req.query.status;
    if (req.query.category) filter.category = req.query.category;

    if (req.query.fromDate || req.query.toDate) {
      filter.transactionDate = {};
      if (req.query.fromDate) filter.transactionDate.$gte = new Date(req.query.fromDate);
      if (req.query.toDate)   filter.transactionDate.$lte = new Date(req.query.toDate);
    }

    if (req.query.minAmount || req.query.maxAmount) {
      filter.amount = {};
      if (req.query.minAmount) filter.amount.$gte = parseFloat(req.query.minAmount);
      if (req.query.maxAmount) filter.amount.$lte = parseFloat(req.query.maxAmount);
    }

    if (req.query.search) {
      const re = new RegExp(req.query.search, 'i');
      filter.$or = [{ description: re }, { merchant: re }, { referenceNumber: re }];
    }

    const [transactions, total] = await Promise.all([
      Transaction.find(filter).sort({ transactionDate: -1 }).skip(skip).limit(limit).lean(),
      Transaction.countDocuments(filter),
    ]);

    return res.status(200).json({
      success:    true,
      data:       transactions,
      account: {
        id:               account._id,
        accountName:      account.accountName,
        accountType:      account.accountType,
        last4:            account.last4,
        balance:          account.balance,
        availableBalance: account.availableBalance,
        status:           account.status,
      },
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/accounts/:id/pending ────────────────────────────────
export async function getPendingTransactions(req, res, next) {
  try {
    const userId  = req.user._id;
    const account = await BankAccount.findOne({ _id: req.params.id, user: userId });
    if (!account) return res.status(404).json({ success: false, message: 'Account not found.' });

    const transactions = await Transaction.find({
      account: account._id,
      status:  'pending',
    }).sort({ transactionDate: -1 }).limit(50).lean();

    return res.status(200).json({ success: true, data: transactions });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/accounts/:id/statement/:period ───────────────────────
// period = YYYY-MM  (e.g. 2025-01)
export async function getStatement(req, res, next) {
  try {
    const userId  = req.user._id;
    const account = await BankAccount.findOne({ _id: req.params.id, user: userId });
    if (!account) return res.status(404).json({ success: false, message: 'Account not found.' });

    const { period } = req.params;
    if (!/^\d{4}-\d{2}$/.test(period)) {
      return res.status(400).json({ success: false, message: 'Period must be in YYYY-MM format.' });
    }

    const [year, month] = period.split('-').map(Number);
    const fromDate = new Date(year, month - 1, 1);
    const toDate   = new Date(year, month, 1); // exclusive

    const transactions = await Transaction.find({
      account:         account._id,
      transactionDate: { $gte: fromDate, $lt: toDate },
      status:          { $ne: 'failed' },
    }).sort({ transactionDate: 1 }).lean();

    // Summary
    let totalDebits = 0, totalCredits = 0;
    const categoryTotals = {};
    for (const tx of transactions) {
      if (tx.type === 'debit')  totalDebits  = round2(totalDebits  + tx.amount);
      if (tx.type === 'credit') totalCredits = round2(totalCredits + tx.amount);
      if (tx.type === 'debit') {
        categoryTotals[tx.category] = round2((categoryTotals[tx.category] ?? 0) + tx.amount);
      }
    }

    const openingBalance  = transactions.length > 0 ? (transactions[0].balanceAfter + (transactions[0].type === 'debit' ? transactions[0].amount : -transactions[0].amount)) : account.balance;
    const closingBalance  = transactions.length > 0 ? transactions[transactions.length - 1].balanceAfter : account.balance;

    audit.logStatementDownload({ user: req.user, account, period, req }).catch(() => {});

    return res.status(200).json({
      success: true,
      data: {
        period,
        account: {
          id:          account._id,
          accountName: account.accountName,
          accountType: account.accountType,
          last4:       account.last4,
          routingNumber: account.routingNumber,
        },
        summary: {
          openingBalance,
          closingBalance,
          totalDebits,
          totalCredits,
          netChange:      round2(totalCredits - totalDebits),
          transactionCount: transactions.length,
          categoryBreakdown: Object.entries(categoryTotals)
            .map(([category, total]) => ({ category, total }))
            .sort((a, b) => b.total - a.total),
        },
        transactions,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/accounts/:id/summary ────────────────────────────────
// ?months=6 (default 6)
export async function getAccountSummary(req, res, next) {
  try {
    const userId  = req.user._id;
    const account = await BankAccount.findOne({ _id: req.params.id, user: userId });
    if (!account) return res.status(404).json({ success: false, message: 'Account not found.' });

    const months    = Math.min(12, Math.max(1, parseInt(req.query.months) || 6));
    const fromDate  = new Date();
    fromDate.setMonth(fromDate.getMonth() - months);
    fromDate.setDate(1);
    fromDate.setHours(0, 0, 0, 0);

    const [spendingByCategory, monthlyTotals] = await Promise.all([
      Transaction.aggregate([
        {
          $match: {
            account:         account._id,
            type:            'debit',
            status:          'completed',
            transactionDate: { $gte: fromDate },
          },
        },
        {
          $group: {
            _id:    '$category',
            total:  { $sum: '$amount' },
            count:  { $sum: 1 },
          },
        },
        { $sort: { total: -1 } },
      ]),
      Transaction.aggregate([
        {
          $match: {
            account:         account._id,
            status:          'completed',
            transactionDate: { $gte: fromDate },
          },
        },
        {
          $group: {
            _id:     { $dateToString: { format: '%Y-%m', date: '$transactionDate' } },
            debits:  { $sum: { $cond: [{ $eq: ['$type', 'debit'] },  '$amount', 0] } },
            credits: { $sum: { $cond: [{ $eq: ['$type', 'credit'] }, '$amount', 0] } },
            count:   { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    return res.status(200).json({
      success: true,
      data: {
        account: {
          id:               account._id,
          accountName:      account.accountName,
          balance:          account.balance,
          availableBalance: account.availableBalance,
        },
        period: { months, fromDate },
        spendingByCategory: spendingByCategory.map(c => ({
          category: c._id,
          total:    round2(c.total),
          count:    c.count,
        })),
        monthlyTotals: monthlyTotals.map(m => ({
          month:   m._id,
          debits:  round2(m.debits),
          credits: round2(m.credits),
          net:     round2(m.credits - m.debits),
          count:   m.count,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/accounts/:id/ledger ─────────────────────────────────
export async function getAccountLedger(req, res, next) {
  try {
    const userId  = req.user._id;
    const account = await BankAccount.findOne({ _id: req.params.id, user: userId });
    if (!account) return res.status(404).json({ success: false, message: 'Account not found.' });

    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 25);
    const skip  = (page - 1) * limit;

    const [entries, total] = await Promise.all([
      LedgerEntry.find({ account: account._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('transactionId', 'referenceNumber description category')
        .lean(),
      LedgerEntry.countDocuments({ account: account._id }),
    ]);

    return res.status(200).json({
      success: true,
      data:    entries,
      pagination: { total, page, limit, pages: Math.ceil(total / limit) },
    });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/accounts/:id/statement/:period/pdf ───────────────────
export async function getStatementPDF(req, res, next) {
  try {
    const userId  = req.user._id;
    const account = await BankAccount.findOne({ _id: req.params.id, user: userId });
    if (!account) return res.status(404).json({ success: false, message: 'Account not found.' });

    const { period } = req.params;
    if (!/^\d{4}-\d{2}$/.test(period)) {
      return res.status(400).json({ success: false, message: 'Period must be in YYYY-MM format.' });
    }

    const [year, month] = period.split('-').map(Number);
    const fromDate  = new Date(year, month - 1, 1);
    const toDate    = new Date(year, month, 1);
    const monthName = fromDate.toLocaleString('en-US', { month: 'long' });

    const transactions = await Transaction.find({
      account:         account._id,
      transactionDate: { $gte: fromDate, $lt: toDate },
      status:          { $ne: 'failed' },
    }).sort({ transactionDate: 1 }).lean();

    let totalDebits = 0, totalCredits = 0;
    const categoryTotals = {};
    for (const tx of transactions) {
      if (tx.type === 'debit')  totalDebits  = round2(totalDebits  + tx.amount);
      if (tx.type === 'credit') totalCredits = round2(totalCredits + tx.amount);
      if (tx.type === 'debit') {
        categoryTotals[tx.category] = round2((categoryTotals[tx.category] ?? 0) + tx.amount);
      }
    }

    const openingBalance = transactions.length > 0
      ? round2(transactions[0].balanceAfter + (transactions[0].type === 'debit' ? transactions[0].amount : -transactions[0].amount))
      : account.balance;
    const closingBalance = transactions.length > 0
      ? transactions[transactions.length - 1].balanceAfter
      : account.balance;

    audit.logStatementDownload({ user: req.user, account, period, req }).catch(() => {});

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="statement-${account.last4}-${period}.pdf"`);
    doc.pipe(res);

    // ── Header ────────────────────────────────────────────────────
    doc.fontSize(22).font('Helvetica-Bold').fillColor('#002D72').text('Bank of Molten');
    doc.moveDown(0.2);
    doc.fontSize(10).font('Helvetica').fillColor('#555')
       .text(`${monthName} ${year} Statement`);
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).lineWidth(1).strokeColor('#002D72').stroke();
    doc.moveDown(0.5);

    // ── Account info ──────────────────────────────────────────────
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#000').text(account.accountName);
    doc.fontSize(10).font('Helvetica').fillColor('#444')
       .text(`Account: ••••${account.last4}`);
    if (account.routingNumber) doc.text(`Routing: ${account.routingNumber}`);
    doc.moveDown(0.8);

    // ── Summary ───────────────────────────────────────────────────
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#000').text('Account Summary');
    doc.moveDown(0.3);
    doc.fontSize(10).font('Helvetica').fillColor('#333');
    const summaryRows = [
      ['Opening Balance', `$${openingBalance.toFixed(2)}`],
      ['Total Credits',   `+$${totalCredits.toFixed(2)}`],
      ['Total Debits',    `-$${totalDebits.toFixed(2)}`],
      ['Closing Balance', `$${closingBalance.toFixed(2)}`],
    ];
    for (const [label, value] of summaryRows) {
      const y = doc.y;
      doc.text(label, 50, y, { width: 200 });
      doc.font('Helvetica-Bold').text(value, 250, y, { width: 150 });
      doc.font('Helvetica');
      doc.moveDown(0.3);
    }
    doc.moveDown(0.5);

    // ── Transactions ──────────────────────────────────────────────
    doc.moveTo(50, doc.y).lineTo(545, doc.y).lineWidth(0.5).strokeColor('#ccc').stroke();
    doc.moveDown(0.5);
    doc.fontSize(11).font('Helvetica-Bold').fillColor('#000').text('Transactions');
    doc.moveDown(0.4);

    if (transactions.length === 0) {
      doc.fontSize(10).font('Helvetica').fillColor('#888').text('No transactions for this period.');
    } else {
      // Column header
      doc.fontSize(8).font('Helvetica-Bold').fillColor('#555');
      const hY = doc.y;
      doc.text('Date',        50,  hY, { width: 55 });
      doc.text('Description', 105, hY, { width: 245 });
      doc.text('Amount',      350, hY, { width: 90, align: 'right' });
      doc.text('Balance',     440, hY, { width: 105, align: 'right' });
      doc.moveDown(0.3);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).lineWidth(0.5).strokeColor('#ddd').stroke();
      doc.moveDown(0.3);

      doc.fontSize(9).font('Helvetica');
      for (const tx of transactions) {
        if (doc.y > 720) doc.addPage();
        const dateStr = new Date(tx.transactionDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const sign    = tx.type === 'debit' ? '-' : '+';
        const color   = tx.type === 'debit' ? '#000' : '#16a34a';
        const desc    = (tx.description || '—').substring(0, 44);

        const rowY = doc.y;
        doc.fillColor('#555').text(dateStr,    50,  rowY, { width: 55 });
        doc.fillColor('#000').text(desc,        105, rowY, { width: 245 });
        doc.fillColor(color).text(`${sign}$${tx.amount.toFixed(2)}`, 350, rowY, { width: 90,  align: 'right' });
        doc.fillColor('#444').text(`$${tx.balanceAfter.toFixed(2)}`, 440, rowY, { width: 105, align: 'right' });
        doc.moveDown(0.45);
      }
    }

    // ── Category breakdown ────────────────────────────────────────
    const cats = Object.entries(categoryTotals).sort(([, a], [, b]) => b - a);
    if (cats.length > 0) {
      doc.moveDown(0.5);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).lineWidth(0.5).strokeColor('#ccc').stroke();
      doc.moveDown(0.5);
      doc.fontSize(11).font('Helvetica-Bold').fillColor('#000').text('Spending by Category');
      doc.moveDown(0.3);
      doc.fontSize(10).font('Helvetica');
      for (const [cat, total] of cats) {
        if (doc.y > 720) doc.addPage();
        const label = cat.charAt(0).toUpperCase() + cat.slice(1);
        const y = doc.y;
        doc.fillColor('#333').text(label,               50,  y, { width: 300 });
        doc.font('Helvetica-Bold').fillColor('#000').text(`$${total.toFixed(2)}`, 350, y, { width: 90, align: 'right' });
        doc.font('Helvetica');
        doc.moveDown(0.3);
      }
    }

    // ── Footer ────────────────────────────────────────────────────
    doc.moveDown(2);
    doc.fontSize(8).fillColor('#aaa')
       .text('This statement is provided for informational purposes. Contact us at support@bankofmolten.com with any questions.', { align: 'center' });

    doc.end();
  } catch (err) {
    next(err);
  }
}
