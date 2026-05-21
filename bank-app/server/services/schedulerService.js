import cron from 'node-cron';
import BillPayment from '../models/BillPayment.js';
import Payee       from '../models/Payee.js';
import { createNotification } from '../utils/notify.js';
import { getIO }              from '../socket/index.js';
import * as engine            from './bankingEngine.js';
import * as audit             from './auditService.js';

function nextDate(from, rule) {
  const d = new Date(from);
  switch (rule) {
    case 'weekly':    d.setDate(d.getDate() + 7);        break;
    case 'biweekly':  d.setDate(d.getDate() + 14);       break;
    case 'monthly':   d.setMonth(d.getMonth() + 1);      break;
    case 'quarterly': d.setMonth(d.getMonth() + 3);      break;
    case 'annually':  d.setFullYear(d.getFullYear() + 1); break;
    default: return null;
  }
  return d;
}

async function processPayment(payment) {
  const payee = await Payee.findById(payment.payee).lean();
  if (!payee) {
    payment.status        = 'failed';
    payment.failureReason = 'Payee not found';
    await payment.save();
    return;
  }

  try {
    const engineResult = await engine.withdrawFunds({
      accountId:   String(payment.fromAccount),
      amount:      payment.amount,
      description: `Bill Pay — ${payee.nickname || payee.name}`,
      category:    'billpay',
      initiatedBy: payment.user,
      metadata: {
        payeeId:            String(payment.payee),
        payeeName:          payee.name,
        confirmationNumber: payment.confirmationNumber,
        billPaymentId:      String(payment._id),
      },
    });

    payment.status        = 'completed';
    payment.processedDate = new Date();
    payment.transaction   = engineResult.transaction._id;
    await payment.save();

    await Payee.findByIdAndUpdate(payment.payee, {
      $set: { lastPaymentDate: new Date(), lastPaymentAmount: payment.amount },
      $inc: { totalPaid: payment.amount, paymentCount: 1 },
    });

    if (payment.isRecurring && payment.recurringRule !== 'once') {
      const nextScheduled = nextDate(payment.scheduledDate, payment.recurringRule);
      const endDate       = payment.recurringEndDate;
      if (nextScheduled && (!endDate || nextScheduled <= endDate)) {
        const nextPayment = await BillPayment.create({
          user:             payment.user,
          fromAccount:      payment.fromAccount,
          payee:            payment.payee,
          amount:           payment.amount,
          memo:             payment.memo,
          scheduledDate:    nextScheduled,
          isRecurring:      true,
          recurringRule:    payment.recurringRule,
          recurringEndDate: payment.recurringEndDate,
          parentPaymentId:  payment._id,
        });
        payment.nextPaymentId = nextPayment._id;
        await payment.save();
      }
    }

    audit.logBillPayProcessed({ payment, payee, success: true }).catch(() => {});

    createNotification({
      userId:   payment.user,
      title:    'Bill payment processed',
      message:  `Your scheduled payment of $${payment.amount.toFixed(2)} to ${payee.nickname || payee.name} was processed successfully.`,
      type:     'success',
      category: 'billpay',
      metadata: { confirmationNumber: payment.confirmationNumber },
    }).catch(() => {});

  } catch (err) {
    payment.status        = 'failed';
    payment.failureReason = err.message || 'Processing failed';
    await payment.save();

    audit.logBillPayProcessed({ payment, payee, success: false, reason: err.message }).catch(() => {});

    const io = getIO();
    if (io) {
      io.to('admins').emit('admin:billPayFailed', {
        paymentId: String(payment._id),
        amount:    payment.amount,
        payeeName: payee.name,
        userId:    String(payment.user),
        reason:    err.message,
      });
    }

    createNotification({
      userId:   payment.user,
      title:    'Bill payment failed',
      message:  `Your scheduled payment of $${payment.amount.toFixed(2)} to ${payee.nickname || payee.name} could not be processed. Please try again or contact support.`,
      type:     'error',
      category: 'billpay',
    }).catch(() => {});
  }
}

async function claimAndProcess(id) {
  const payment = await BillPayment.findOneAndUpdate(
    { _id: id, status: 'pending' },
    { $set: { status: 'processing' } },
    { new: true }
  );
  if (!payment) return;
  return processPayment(payment);
}

export async function runBillPayScheduler() {
  const now = new Date();
  const due = await BillPayment.find(
    { status: 'pending', scheduledDate: { $lte: now } },
    '_id'
  ).limit(100).lean();

  if (due.length === 0) return;
  console.log(`[scheduler] Processing ${due.length} due bill payment(s)…`);

  await Promise.allSettled(due.map(({ _id }) => claimAndProcess(_id)));
}

export function startScheduler() {
  cron.schedule('* * * * *', async () => {
    try {
      await runBillPayScheduler();
    } catch (err) {
      console.error('[scheduler] bill-pay job error:', err.message);
    }
  });
  console.log('  Scheduler  → bill-pay job running (every minute)');
}
