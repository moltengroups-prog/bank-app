import User from '../models/User.js';
import BankAccount from '../models/BankAccount.js';
import Transaction from '../models/Transaction.js';
import SupportConversation from '../models/SupportConversation.js';
import SupportMessage from '../models/SupportMessage.js';
import { createError } from '../middleware/error.js';
import { getIO } from '../socket/index.js';
import * as engine from '../services/bankingEngine.js';
import * as audit  from '../services/auditService.js';
import { AUDIT_ACTIONS } from '../models/AuditLog.js';

// ── GET /api/admin/users ──────────────────────────────────────────
export async function getUsers(req, res, next) {
  try {
    const { page = 1, limit = 20, search = '' } = req.query;
    const parsedPage  = Math.max(parseInt(page)  || 1,  1);
    const parsedLimit = Math.min(Math.max(parseInt(limit) || 20, 1), 100);
    const skip = (parsedPage - 1) * parsedLimit;

    const filter = { role: 'user' };
    if (search) {
      const re = new RegExp(search, 'i');
      filter.$or = [{ firstName: re }, { lastName: re }, { email: re }];
    }

    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(parsedLimit),
      User.countDocuments(filter),
    ]);

    const data = users.map((u) => ({
      id:          u._id,
      firstName:   u.firstName,
      lastName:    u.lastName,
      email:       u.email,
      phoneNumber: u.phoneNumber,
      isVerified:  u.isVerified,
      createdAt:   u.createdAt,
    }));

    res.json({
      success: true,
      data,
      pagination: { page: parsedPage, limit: parsedLimit, total, pages: Math.ceil(total / parsedLimit) },
    });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/admin/users/:id ──────────────────────────────────────
export async function getUserById(req, res, next) {
  try {
    const user = await User.findOne({ _id: req.params.id, role: 'user' });
    if (!user) return next(createError('User not found', 404));

    const [accounts, recentTxs, openConvos] = await Promise.all([
      BankAccount.find({ user: user._id, status: { $ne: 'closed' } }).sort({ isPrimary: -1 }),
      Transaction.find({ user: user._id })
        .sort({ transactionDate: -1 })
        .limit(10)
        .populate('account', 'accountName accountType last4'),
      SupportConversation.find({ user: user._id, status: { $ne: 'closed' } })
        .sort({ lastMessageAt: -1 })
        .limit(5),
    ]);

    res.json({
      success: true,
      data: {
        user: {
          id:          user._id,
          firstName:   user.firstName,
          lastName:    user.lastName,
          email:       user.email,
          phoneNumber: user.phoneNumber,
          isVerified:  user.isVerified,
          createdAt:   user.createdAt,
        },
        accounts: accounts.map((a) => ({
          id:               a._id,
          accountName:      a.accountName,
          accountType:      a.accountType,
          maskedNumber:     `••••${a.last4}`,
          availableBalance: a.availableBalance,
          status:           a.status,
          isPrimary:        a.isPrimary,
        })),
        recentTransactions: recentTxs.map((tx) => ({
          id:              tx._id,
          type:            tx.type,
          amount:          tx.amount,
          description:     tx.description,
          status:          tx.status,
          transactionDate: tx.transactionDate,
          account:         tx.account
            ? { accountName: tx.account.accountName, maskedNumber: `••••${tx.account.last4}` }
            : null,
        })),
        openConversations: openConvos.map((c) => ({
          id:          c._id,
          status:      c.status,
          source:      c.source,
          priority:    c.priority,
          lastMessageAt: c.lastMessageAt,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/admin/conversations ──────────────────────────────────
export async function getConversations(req, res, next) {
  try {
    const { status, page = 1, limit = 30 } = req.query;
    const parsedPage  = Math.max(parseInt(page)  || 1,  1);
    const parsedLimit = Math.min(Math.max(parseInt(limit) || 30, 1), 100);
    const skip = (parsedPage - 1) * parsedLimit;

    const filter = {};
    if (status) filter.status = status;

    const [conversations, total] = await Promise.all([
      SupportConversation.find(filter)
        .sort({ priority: -1, lastMessageAt: -1 })
        .skip(skip)
        .limit(parsedLimit)
        .populate('user', 'firstName lastName email')
        .populate('assignedAgent', 'firstName lastName email'),
      SupportConversation.countDocuments(filter),
    ]);

    const data = conversations.map((c) => ({
      id:            c._id,
      status:        c.status,
      source:        c.source,
      priority:      c.priority,
      lastMessageAt: c.lastMessageAt,
      startedAt:     c.startedAt,
      user:          c.user
        ? { id: c.user._id, firstName: c.user.firstName, lastName: c.user.lastName, email: c.user.email }
        : null,
      assignedAgent: c.assignedAgent
        ? { id: c.assignedAgent._id, firstName: c.assignedAgent.firstName, lastName: c.assignedAgent.lastName }
        : null,
    }));

    res.json({
      success: true,
      data,
      pagination: { page: parsedPage, limit: parsedLimit, total, pages: Math.ceil(total / parsedLimit) },
    });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/admin/conversations/:id/messages ─────────────────────
export async function getConversationMessages(req, res, next) {
  try {
    const conversation = await SupportConversation.findById(req.params.id)
      .populate('user', 'firstName lastName email');
    if (!conversation) return next(createError('Conversation not found', 404));

    const messages = await SupportMessage.find({ conversation: req.params.id })
      .sort({ createdAt: 1 })
      .populate('sender', 'firstName lastName role');

    const data = messages.map((m) => ({
      id:         m._id,
      senderType: m.senderType,
      message:    m.message,
      isRead:     m.isRead,
      createdAt:  m.createdAt,
      sender:     m.sender
        ? { id: m.sender._id, firstName: m.sender.firstName, lastName: m.sender.lastName, role: m.sender.role }
        : null,
    }));

    res.json({
      success: true,
      data,
      conversation: {
        id:       conversation._id,
        status:   conversation.status,
        source:   conversation.source,
        priority: conversation.priority,
        user:     conversation.user
          ? { id: conversation.user._id, firstName: conversation.user.firstName, lastName: conversation.user.lastName, email: conversation.user.email }
          : null,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ── POST /api/admin/conversations/:id/message ─────────────────────
export async function postAgentMessage(req, res, next) {
  try {
    const { message } = req.body;
    if (!message?.trim()) return next(createError('Message is required', 400));

    const conversation = await SupportConversation.findById(req.params.id);
    if (!conversation) return next(createError('Conversation not found', 404));
    if (conversation.status === 'closed') return next(createError('Conversation is closed', 400));

    const msg = await SupportMessage.create({
      conversation: conversation._id,
      sender:       req.user._id,
      senderType:   'agent',
      message:      message.trim(),
    });

    const newStatus = conversation.status === 'waiting' ? 'active' : conversation.status;
    await SupportConversation.findByIdAndUpdate(conversation._id, {
      lastMessageAt: new Date(),
      status: newStatus,
    });

    const msgData = {
      id:         msg._id,
      senderType: msg.senderType,
      message:    msg.message,
      createdAt:  msg.createdAt,
      sender: {
        id:        req.user._id,
        firstName: req.user.firstName,
        lastName:  req.user.lastName,
        role:      req.user.role,
      },
    };

    // Broadcast to conversation room so the customer sees the reply instantly
    const io = getIO();
    if (io) {
      io.to(`conversation:${conversation._id}`).emit('support:newMessage', msgData);
      io.to('admins').emit('support:conversationActivity', {
        conversationId: conversation._id,
        lastMessageAt:  new Date(),
        status:         newStatus,
      });
    }

    res.status(201).json({ success: true, data: msgData });
  } catch (err) {
    next(err);
  }
}

// ── PATCH /api/admin/conversations/:id/assign ─────────────────────
export async function assignConversation(req, res, next) {
  try {
    const { agentId } = req.body;

    // Assign to requester if no agentId provided
    const targetAgent = agentId || req.user._id;

    if (agentId) {
      const agent = await User.findOne({ _id: agentId, role: { $in: ['admin', 'support-agent'] } });
      if (!agent) return next(createError('Agent not found', 404));
    }

    const conversation = await SupportConversation.findByIdAndUpdate(
      req.params.id,
      { assignedAgent: targetAgent, status: 'active' },
      { new: true }
    ).populate('assignedAgent', 'firstName lastName email');

    if (!conversation) return next(createError('Conversation not found', 404));

    // System message for audit trail
    const systemMsg = await SupportMessage.create({
      conversation: conversation._id,
      senderType:   'system',
      message:      `Conversation assigned to ${conversation.assignedAgent?.firstName || 'agent'}.`,
    });

    // Notify conversation participants of the assignment
    const io = getIO();
    if (io) {
      const assignData = {
        conversationId: conversation._id,
        status:         conversation.status,
        assignedAgent:  conversation.assignedAgent
          ? { id: conversation.assignedAgent._id, firstName: conversation.assignedAgent.firstName, lastName: conversation.assignedAgent.lastName }
          : null,
      };
      io.to(`conversation:${conversation._id}`).emit('support:conversationAssigned', assignData);
      io.to(`conversation:${conversation._id}`).emit('support:newMessage', {
        id: systemMsg._id, senderType: 'system', message: systemMsg.message, createdAt: systemMsg.createdAt,
      });
      io.to('admins').emit('support:conversationActivity', {
        conversationId: conversation._id,
        status:         'active',
        lastMessageAt:  new Date(),
      });
    }

    res.json({
      success: true,
      data: {
        id:            conversation._id,
        status:        conversation.status,
        assignedAgent: conversation.assignedAgent
          ? { id: conversation.assignedAgent._id, firstName: conversation.assignedAgent.firstName, lastName: conversation.assignedAgent.lastName }
          : null,
      },
    });
  } catch (err) {
    next(err);
  }
}

// ── PATCH /api/admin/conversations/:id/close ──────────────────────
export async function closeConversation(req, res, next) {
  try {
    const conversation = await SupportConversation.findByIdAndUpdate(
      req.params.id,
      { status: 'closed', closedAt: new Date() },
      { new: true }
    );

    if (!conversation) return next(createError('Conversation not found', 404));

    const systemMsg = await SupportMessage.create({
      conversation: conversation._id,
      senderType:   'system',
      message:      'This conversation has been closed.',
    });

    // Notify conversation participants
    const io = getIO();
    if (io) {
      io.to(`conversation:${conversation._id}`).emit('support:newMessage', {
        id: systemMsg._id, senderType: 'system', message: systemMsg.message, createdAt: systemMsg.createdAt,
      });
      io.to(`conversation:${conversation._id}`).emit('support:conversationAssigned', {
        conversationId: conversation._id,
        status:         'closed',
      });
      io.to('admins').emit('support:conversationActivity', {
        conversationId: conversation._id,
        status:         'closed',
        lastMessageAt:  new Date(),
      });
    }

    res.json({ success: true, data: { id: conversation._id, status: conversation.status, closedAt: conversation.closedAt } });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/admin/accounts ───────────────────────────────────────
export async function getAdminAccounts(req, res, next) {
  try {
    const { page = 1, limit = 20, status, userId } = req.query;
    const parsedPage  = Math.max(parseInt(page) || 1, 1);
    const parsedLimit = Math.min(Math.max(parseInt(limit) || 20, 1), 100);
    const skip = (parsedPage - 1) * parsedLimit;

    const filter = {};
    if (status) filter.status = status;
    if (userId) filter.user = userId;

    const [accounts, total] = await Promise.all([
      BankAccount.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parsedLimit)
        .populate('user', 'firstName lastName email'),
      BankAccount.countDocuments(filter),
    ]);

    const data = accounts.map((a) => ({
      id:               a._id,
      accountName:      a.accountName,
      accountType:      a.accountType,
      maskedNumber:     `••••${a.last4}`,
      balance:          a.balance,
      availableBalance: a.availableBalance,
      status:           a.status,
      isPrimary:        a.isPrimary,
      createdAt:        a.createdAt,
      user:             a.user
        ? { id: a.user._id, firstName: a.user.firstName, lastName: a.user.lastName, email: a.user.email }
        : null,
    }));

    res.json({
      success: true,
      data,
      pagination: { page: parsedPage, limit: parsedLimit, total, pages: Math.ceil(total / parsedLimit) },
    });
  } catch (err) {
    next(err);
  }
}

// ── PATCH /api/admin/accounts/:id/status ─────────────────────────
export async function updateAccountStatus(req, res, next) {
  try {
    const { status, reason } = req.body;
    if (!['active', 'frozen', 'closed'].includes(status)) {
      return next(createError('Invalid status value', 400));
    }

    let result;
    if (status === 'frozen') {
      result = await engine.freezeAccount({ accountId: req.params.id, reason, adminId: req.user._id });
    } else if (status === 'active') {
      result = await engine.unfreezeAccount({ accountId: req.params.id, reason, adminId: req.user._id });
    } else {
      // 'closed' — not routed through the engine (no balance movement)
      result = { account: await BankAccount.findByIdAndUpdate(req.params.id, { status }, { new: true }) };
      if (!result.account) return next(createError('Account not found', 404));
    }

    if (!result.account) return next(createError('Account not found', 404));

    const account = await BankAccount.findById(req.params.id).populate('user', 'firstName lastName email');

    // Audit
    if (status === 'frozen') {
      audit.logAccountFreeze({ admin: req.user, account, reason, req }).catch(() => {});
    } else if (status === 'active') {
      audit.logAccountUnfreeze({ admin: req.user, account, reason, req }).catch(() => {});
    }

    res.json({
      success: true,
      data: {
        id:           account._id,
        status:       account.status,
        accountName:  account.accountName,
        maskedNumber: `••••${account.last4}`,
        user:         account.user
          ? { id: account.user._id, firstName: account.user.firstName, lastName: account.user.lastName }
          : null,
      },
    });
  } catch (err) {
    if (err.code === 'ACCOUNT_NOT_FOUND') return next(createError(err.message, 404));
    next(err);
  }
}

// ── PATCH /api/admin/accounts/:id/balance ────────────────────────
export async function adjustBalance(req, res, next) {
  try {
    const { adjustmentType, amount, reason } = req.body;
    if (!['credit', 'debit'].includes(adjustmentType)) {
      return next(createError('adjustmentType must be credit or debit', 400));
    }
    const parsedAmount = parseFloat(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      return next(createError('Amount must be a positive number', 400));
    }
    if (!reason?.trim()) return next(createError('Reason is required', 400));

    // signed amount: positive = credit, negative = debit
    const signedAmount = adjustmentType === 'credit' ? parsedAmount : -parsedAmount;

    const result = await engine.applyAdminAdjustment({
      accountId:   req.params.id,
      amount:      signedAmount,
      description: 'Admin Balance Adjustment',
      reason:      reason.trim(),
      adminId:     req.user._id,
      metadata:    { adjustmentType, initiatedBy: req.user.email },
    });

    // Audit log
    const account = await BankAccount.findById(req.params.id).populate('user', '_id');
    audit.logBalanceAdjustment({ admin: req.user, account, adjustment: result, reason: reason.trim(), req }).catch(() => {});

    res.json({
      success: true,
      data: {
        id:              req.params.id,
        newBalance:      result.balanceAfter,
        newAvailable:    result.balanceAfter,
        adjustmentType,
        amount:          parsedAmount,
        reason:          reason.trim(),
        transactionId:   result.transaction._id,
      },
    });
  } catch (err) {
    if (err.code === 'ACCOUNT_NOT_FOUND')  return next(createError(err.message, 404));
    if (err.code === 'INSUFFICIENT_FUNDS') return next(createError(err.message, 400));
    if (err.code === 'INVALID_AMOUNT')     return next(createError(err.message, 400));
    next(err);
  }
}

// ── GET /api/admin/transfers ──────────────────────────────────────
export async function getAdminTransfers(req, res, next) {
  try {
    const { page = 1, limit = 30, status, type, userId } = req.query;
    const parsedPage  = Math.max(parseInt(page) || 1, 1);
    const parsedLimit = Math.min(Math.max(parseInt(limit) || 30, 1), 100);
    const skip = (parsedPage - 1) * parsedLimit;

    const filter = { category: { $in: ['transfer', 'wire', 'zelle', 'billpay'] } };
    if (status) filter.status = status;
    if (type)   filter.type   = type;
    if (userId) filter.user   = userId;

    const [transfers, total] = await Promise.all([
      Transaction.find(filter)
        .sort({ transactionDate: -1 })
        .skip(skip)
        .limit(parsedLimit)
        .populate('user', 'firstName lastName email')
        .populate('account', 'accountName last4 accountType'),
      Transaction.countDocuments(filter),
    ]);

    const data = transfers.map((tx) => ({
      id:              tx._id,
      type:            tx.type,
      category:        tx.category,
      amount:          tx.amount,
      description:     tx.description,
      status:          tx.status,
      referenceNumber: tx.referenceNumber,
      transactionDate: tx.transactionDate,
      user:            tx.user
        ? { id: tx.user._id, firstName: tx.user.firstName, lastName: tx.user.lastName, email: tx.user.email }
        : null,
      account:         tx.account
        ? { accountName: tx.account.accountName, maskedNumber: `••••${tx.account.last4}`, accountType: tx.account.accountType }
        : null,
    }));

    res.json({
      success: true,
      data,
      pagination: { page: parsedPage, limit: parsedLimit, total, pages: Math.ceil(total / parsedLimit) },
    });
  } catch (err) {
    next(err);
  }
}

// ── GET /api/admin/analytics/overview ────────────────────────────
export async function getAnalyticsOverview(req, res, next) {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      totalAccounts,
      frozenAccounts,
      openConversations,
      todayTxs,
      totalBalanceAgg,
      categoryAgg,
      recentDailyVolume,
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      BankAccount.countDocuments({ status: { $ne: 'closed' } }),
      BankAccount.countDocuments({ status: 'frozen' }),
      SupportConversation.countDocuments({ status: { $in: ['waiting', 'active'] } }),
      Transaction.aggregate([
        { $match: { transactionDate: { $gte: today }, status: 'completed' } },
        { $group: { _id: '$type', count: { $sum: 1 }, volume: { $sum: '$amount' } } },
      ]),
      BankAccount.aggregate([
        { $match: { status: { $ne: 'closed' } } },
        { $group: { _id: null, total: { $sum: '$balance' } } },
      ]),
      Transaction.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: '$category', count: { $sum: 1 }, volume: { $sum: '$amount' } } },
        { $sort: { volume: -1 } },
        { $limit: 8 },
      ]),
      Transaction.aggregate([
        {
          $match: {
            transactionDate: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
            status: 'completed',
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$transactionDate' } },
            volume: { $sum: '$amount' },
            count:  { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
    ]);

    const todayCredit = todayTxs.find((t) => t._id === 'credit') || { count: 0, volume: 0 };
    const todayDebit  = todayTxs.find((t) => t._id === 'debit')  || { count: 0, volume: 0 };

    res.json({
      success: true,
      data: {
        totalUsers,
        totalAccounts,
        frozenAccounts,
        openConversations,
        todayTransactions: todayCredit.count + todayDebit.count,
        todayVolume:        Math.round((todayCredit.volume + todayDebit.volume) * 100) / 100,
        totalBalance:       Math.round((totalBalanceAgg[0]?.total || 0) * 100) / 100,
        categoryBreakdown:  categoryAgg.map((c) => ({ category: c._id, count: c.count, volume: Math.round(c.volume * 100) / 100 })),
        dailyVolume:        recentDailyVolume.map((d) => ({ date: d._id, volume: Math.round(d.volume * 100) / 100, count: d.count })),
      },
    });
  } catch (err) {
    next(err);
  }
}
