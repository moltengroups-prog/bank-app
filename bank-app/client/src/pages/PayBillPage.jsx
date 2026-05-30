import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import LegalDisclosure from '../components/LegalDisclosure';
import TransactionAuthFlow from '../components/TransactionAuthFlow';
import { api } from '../services/api';

// ── helpers ───────────────────────────────────────────────────────
const fmtUSD = (n) => '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

function apiFetch(path, opts = {}) {
  const method = (opts.method || 'GET').toUpperCase();
  const body   = opts.body ? JSON.parse(opts.body) : undefined;
  if (method === 'POST')  return api.post(path, body);
  if (method === 'PATCH') return api.patch(path, body);
  return api.get(path);
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 last:border-0">
      <p className="text-[15px] text-gray-500">{label}</p>
      <p className="text-[15px] text-gray-900 font-medium text-right ml-4 max-w-[58%]">{value}</p>
    </div>
  );
}

const RECURRING_OPTIONS = [
  { value: 'once',      label: 'One Time' },
  { value: 'weekly',    label: 'Weekly' },
  { value: 'biweekly',  label: 'Every 2 weeks' },
  { value: 'monthly',   label: 'Monthly' },
  { value: 'quarterly', label: 'Every 3 months' },
  { value: 'annually',  label: 'Annually' },
];


// ── Main page ─────────────────────────────────────────────────────
export default function PayBillPage() {
  const navigate       = useNavigate();
  const [params]       = useSearchParams();
  const payeeId        = params.get('payeeId');

  const [payee,      setPayee]      = useState(null);
  const [accounts,   setAccounts]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');

  // Form state
  const today = new Date().toISOString().split('T')[0];
  const [amount,           setAmount]           = useState('');
  const [fromAccountId,    setFromAccountId]    = useState('');
  const [scheduledDate,    setScheduledDate]    = useState(today);
  const [memo,             setMemo]             = useState('');
  const [recurringRule,    setRecurringRule]    = useState('once');
  const [recurringEndDate, setRecurringEndDate] = useState('');
  const [step,             setStep]             = useState('form'); // form | confirm | otp | success
  const [confirmation,     setConfirmation]     = useState(null);

  useEffect(() => {
    if (!payeeId) { navigate('/bill-pay'); return; }
    Promise.all([
      apiFetch(`/bill-pay/payees/${payeeId}`),
      apiFetch('/accounts'),
    ]).then(([pRes, aRes]) => {
      setPayee(pRes.data);
      const accts = aRes.data || [];
      setAccounts(accts);
      if (accts.length > 0) setFromAccountId(String(accts[0]._id));
    }).catch(e => setError(e.message)).finally(() => setLoading(false));
  }, [payeeId, navigate]);

  const parsedAmount = parseFloat(amount) || 0;
  const selectedAcct = accounts.find(a => String(a._id) === fromAccountId);
  const isRecurring  = recurringRule !== 'once';
  const canContinue  = parsedAmount >= 0.01 && fromAccountId && scheduledDate;
  const recurringLabel = RECURRING_OPTIONS.find(r => r.value === recurringRule)?.label || recurringRule;

  // Called by OTPStep when user enters a valid code
  const handleOTPSuccess = useCallback(async (billPayOtpToken, billPayOtpCode) => {
    const res = await apiFetch('/bill-pay/payments', {
      method: 'POST',
      body: JSON.stringify({
        fromAccountId,
        payeeId,
        amount:           parsedAmount,
        scheduledDate,
        memo,
        isRecurring,
        recurringRule:    isRecurring ? recurringRule : 'once',
        recurringEndDate: isRecurring && recurringEndDate ? recurringEndDate : undefined,
        billPayOtpToken,
        billPayOtpCode,
      }),
    });
    setConfirmation(res.data);
    setStep('success');
  }, [fromAccountId, payeeId, parsedAmount, scheduledDate, memo, isRecurring, recurringRule, recurringEndDate]);

  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-gray-100 font-sans">
        <AppHeader showBackButton title="Bill Pay" showSpacer />
        <div className="pt-20 text-center text-sm text-gray-400">Loading…</div>
      </div>
    );
  }

  // ── SUCCESS ───────────────────────────────────────────────────
  if (step === 'success') {
    const isScheduled = scheduledDate > today;
    const deliverDate = scheduledDate
      ? fmtDate(new Date(scheduledDate).toISOString().replace('T', ' ').split(' ')[0] + 'T12:00:00')
      : fmtDate(new Date());
    const confNum = confirmation?.confirmationNumber || '—';

    return (
      <div className="flex flex-col h-screen bg-white font-sans">
        <AppHeader title="Success" showSpacer />
        <div className="flex-1 pt-[64px] overflow-y-auto pb-28">

          {/* Header */}
          <div className="pt-8 pb-6 flex flex-col items-center border-b border-gray-100">
            <h1 className="text-[22px] font-bold text-gray-900 text-center mb-5 px-6">
              {isScheduled ? "You've scheduled a payment." : "Your payment is processing."}
            </h1>
            <div className="flex gap-3">
              {['SAVE AS PDF', 'PRINT', 'EMAIL'].map((label) => (
                <button
                  key={label}
                  type="button"
                  className="px-3 py-1.5 border border-gray-300 rounded-full text-[11px] font-bold text-gray-500 tracking-wider"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Payee summary */}
          <div className="px-5 pt-5 pb-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
              </svg>
            </div>
            <div>
              <p className="text-[17px] font-semibold text-gray-900">{payee?.nickname || payee?.name}</p>
              <p className="text-[13px] text-gray-400 capitalize">{payee?.category?.replace('-', ' ') || 'Payee'}</p>
            </div>
          </div>

          {/* Payment details */}
          <div className="bg-white border-t border-b border-gray-100 mt-2">
            {[
              ['Pay From',       selectedAcct ? `${selectedAcct.accountName}` : '—'],
              ['Amount',         fmtUSD(parsedAmount)],
              ['Deliver By',     deliverDate],
              ['Frequency',      recurringLabel],
              ['Payment Type',   'Electronic'],
              ['Confirmation',   confNum],
            ].map(([label, value]) => (
              <div key={label} className="flex items-center justify-between px-5 py-4 border-b border-gray-50 last:border-0">
                <p className="text-[14px] text-gray-500">{label}</p>
                <p className={`text-[14px] font-medium text-right ml-4 max-w-[55%] ${label === 'Confirmation' ? 'font-mono text-[13px] text-gray-600' : 'text-gray-900'}`}>
                  {value}
                </p>
              </div>
            ))}
          </div>

          {memo && (
            <p className="px-5 pt-3 pb-1 text-[13px] text-gray-500">
              <span className="font-medium">Note:</span> {memo}
            </p>
          )}

          <LegalDisclosure />
        </div>

        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 px-5 py-4">
          <button
            type="button"
            onClick={() => navigate('/bill-pay', { replace: true })}
            className="w-full py-4 bg-[#002D72] text-white font-bold text-sm tracking-widest rounded-full"
          >
            DONE
          </button>
        </div>
      </div>
    );
  }

  // ── OTP step ──────────────────────────────────────────────────
  if (step === 'otp') {
    const payeeName = payee?.nickname || payee?.name || 'Payee';
    return (
      <TransactionAuthFlow
        pageTitle="Bill Pay"
        transactionType="Bill Payment"
        amount={parsedAmount}
        recipient={payeeName}
        fromAccount={selectedAcct?.accountName}
        onRequestOTP={async () => {
          const res = await api.post('/bill-pay/payments/request-otp', {});
          return res.billPayOtpToken;
        }}
        onVerify={handleOTPSuccess}
        onCancel={() => setStep('confirm')}
      />
    );
  }

  // ── CONFIRM step ──────────────────────────────────────────────
  if (step === 'confirm') {
    return (
      <div className="flex flex-col h-screen bg-white font-sans">
        <AppHeader showBackButton title="Payment Details" showEricaRight ericaRightCount={0} />
        <div className="flex-1 pt-[64px] overflow-y-auto pb-28">

          {/* Payee header */}
          <div className="flex flex-col items-center pt-8 pb-6">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mb-3">
              <svg className="w-7 h-7 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
              </svg>
            </div>
            <p className="text-[20px] font-bold text-gray-900">{payee?.nickname || payee?.name}</p>
            <p className="text-[13px] text-gray-400 capitalize mt-0.5">{payee?.category?.replace('-', ' ') || 'Payee'}</p>
          </div>

          <div className="bg-white border-t border-b border-gray-100">
            <Row label="Pay From"
              value={selectedAcct ? `${selectedAcct.accountName}\n${fmtUSD(selectedAcct.availableBalance)} available` : '—'} />
            <Row label="Amount"    value={<span className="text-[#1a6bbf] font-bold text-[17px]">{fmtUSD(parsedAmount)}</span>} />
            <Row label="Frequency" value={<span className="text-[#1a6bbf] font-medium">{recurringLabel}</span>} />
            <Row label="Deliver By"
              value={
                <span className="text-[#1a6bbf] font-medium">
                  {fmtDate(new Date(scheduledDate + 'T12:00:00'))}
                  <br />
                  <span className="text-[12px] text-gray-400 font-normal">
                    Earliest Delivery {fmtDate(new Date(new Date(scheduledDate + 'T12:00:00').getTime() - 3 * 86400000))}
                  </span>
                </span>
              }
            />
            {memo && <Row label="Note" value={memo} />}
            {isRecurring && recurringEndDate && (
              <Row label="End Date" value={fmtDate(new Date(recurringEndDate + 'T12:00:00'))} />
            )}
          </div>

          {/* Legal text */}
          <p className="px-5 pt-5 text-[12px] text-gray-400 leading-relaxed">
            Investing involves risk. There is always the potential of losing money when you invest in securities.
            Asset allocation, diversification, and rebalancing do not ensure a profit or protect against loss in declining markets.
          </p>
          <LegalDisclosure />
        </div>

        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 px-5 py-4">
          <div className="flex gap-3">
            <button onClick={() => setStep('form')}
              className="flex-1 py-4 bg-white border-2 border-[#002D72] text-[#002D72] font-bold text-sm tracking-widest rounded-full">
              CANCEL
            </button>
            <button onClick={() => setStep('otp')}
              className="flex-1 py-4 bg-[#002D72] text-white font-bold text-sm tracking-widest rounded-full">
              PAY
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── FORM step ─────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen bg-gray-100 font-sans">
      <AppHeader showBackButton title={`Pay ${payee?.nickname || payee?.name || ''}`} showSpacer />
      <div className="flex-1 pt-[64px] overflow-y-auto pb-24">

        {error && <p className="px-5 pt-4 text-sm text-red-500">{error}</p>}

        {/* Amount */}
        <div className="mx-4 mt-4 bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-6 flex flex-col items-center">
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">Amount</p>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-light text-gray-400">$</span>
              <input
                type="number" min="0.01" step="0.01"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0.00"
                className="text-5xl font-light text-gray-900 w-40 text-center outline-none bg-transparent"
              />
            </div>
            {selectedAcct && (
              <p className="text-xs text-gray-400 mt-2">
                Available: {fmtUSD(selectedAcct.availableBalance)}
              </p>
            )}
          </div>
        </div>

        {/* From account */}
        <div className="mx-4 mt-3 bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between">
            <p className="text-[15px] text-gray-500">Pay From</p>
            <select
              value={fromAccountId}
              onChange={e => setFromAccountId(e.target.value)}
              className="text-[15px] text-[#1a6bbf] font-medium bg-transparent outline-none text-right"
            >
              {accounts.map(a => (
                <option key={a._id} value={a._id}>{a.accountName} ••••{a.last4}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Date + Frequency + Note */}
        <div className="mx-4 mt-3 bg-white rounded-2xl shadow-sm overflow-hidden divide-y divide-gray-100">
          <div className="px-5 py-4 flex items-center justify-between">
            <p className="text-[15px] text-gray-500">Deliver By</p>
            <input
              type="date"
              value={scheduledDate}
              min={today}
              onChange={e => setScheduledDate(e.target.value)}
              className="text-[15px] text-[#1a6bbf] font-medium bg-transparent outline-none"
            />
          </div>
          <div className="px-5 py-4 flex items-center justify-between">
            <p className="text-[15px] text-gray-500">Frequency</p>
            <select
              value={recurringRule}
              onChange={e => setRecurringRule(e.target.value)}
              className="text-[15px] text-[#1a6bbf] font-medium bg-transparent outline-none text-right"
            >
              {RECURRING_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          {isRecurring && (
            <div className="px-5 py-4 flex items-center justify-between">
              <p className="text-[15px] text-gray-500">End Date</p>
              <input
                type="date"
                value={recurringEndDate}
                min={scheduledDate}
                onChange={e => setRecurringEndDate(e.target.value)}
                className="text-[15px] text-[#1a6bbf] font-medium bg-transparent outline-none"
                placeholder="Optional"
              />
            </div>
          )}
          <div className="px-5 py-4 flex items-center justify-between">
            <p className="text-[15px] text-gray-500">Add Note</p>
            <input
              type="text"
              value={memo}
              onChange={e => setMemo(e.target.value)}
              placeholder="Optional"
              maxLength={140}
              className="text-[15px] text-[#1a6bbf] font-medium bg-transparent outline-none text-right w-[55%] placeholder-gray-300"
            />
          </div>
        </div>

        <LegalDisclosure />
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 bg-gray-100 border-t border-gray-200 px-5 py-4">
        <div className="flex gap-3">
          <button onClick={() => navigate(-1)}
            className="flex-1 py-4 bg-white border-2 border-[#002D72] text-[#002D72] font-bold text-sm tracking-widest rounded-full">
            CANCEL
          </button>
          <button onClick={() => setStep('confirm')} disabled={!canContinue}
            className={`flex-1 py-4 font-bold text-sm tracking-widest rounded-full text-white bg-[#002D72] ${canContinue ? 'active:opacity-80' : 'opacity-40'}`}>
            CONTINUE
          </button>
        </div>
      </div>
    </div>
  );
}
