import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import LegalDisclosure from '../components/LegalDisclosure';
import { api } from '../services/api';

function apiFetch(path, options = {}) {
  const method = (options.method || 'GET').toUpperCase();
  const body   = options.body ? JSON.parse(options.body) : undefined;
  if (method === 'POST')   return api.post(path, body);
  if (method === 'PATCH')  return api.patch(path, body);
  if (method === 'DELETE') return api.delete(path);
  return api.get(path);
}

const fmtUSD = (n) => '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 last:border-0">
      <p className="text-base text-gray-500">{label}</p>
      <p className="text-base text-gray-900 font-medium">{value}</p>
    </div>
  );
}

const RECURRING_OPTIONS = [
  { value: 'once',      label: 'One time' },
  { value: 'weekly',    label: 'Weekly' },
  { value: 'biweekly',  label: 'Every 2 weeks' },
  { value: 'monthly',   label: 'Monthly' },
  { value: 'quarterly', label: 'Every 3 months' },
  { value: 'annually',  label: 'Annually' },
];

export default function PayBillPage() {
  const navigate       = useNavigate();
  const [params]       = useSearchParams();
  const payeeId        = params.get('payeeId');

  const [payee,      setPayee]      = useState(null);
  const [accounts,   setAccounts]   = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Form state
  const today = new Date().toISOString().split('T')[0];
  const [amount,            setAmount]            = useState('');
  const [fromAccountId,     setFromAccountId]     = useState('');
  const [scheduledDate,     setScheduledDate]     = useState(today);
  const [memo,              setMemo]              = useState('');
  const [recurringRule,     setRecurringRule]     = useState('once');
  const [recurringEndDate,  setRecurringEndDate]  = useState('');
  const [step,              setStep]              = useState('form'); // 'form' | 'confirm' | 'success'
  const [confirmation,      setConfirmation]      = useState(null);

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

  const handleConfirm = async () => {
    setSubmitting(true);
    setError('');
    try {
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
        }),
      });
      setConfirmation(res.data);
      setStep('success');
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-gray-100 font-sans">
        <AppHeader showBackButton title="Pay Bill" showSpacer />
        <div className="pt-[80px] p-8 text-center text-sm text-gray-400">Loading…</div>
      </div>
    );
  }

  if (step === 'success') {
    return (
      <div className="flex flex-col h-screen bg-gray-100 font-sans">
        <AppHeader title="Payment Sent" showSpacer />
        <div className="flex-1 pt-[64px] overflow-y-auto pb-8">
          <div className="mx-4 mt-6 bg-white rounded-2xl shadow-sm overflow-hidden p-6 text-center">
            <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-1">{fmtUSD(parsedAmount)}</p>
            <p className="text-base text-gray-500 mb-4">Payment to {payee?.nickname || payee?.name}</p>
            {confirmation && (
              <p className="text-xs text-gray-400 font-mono mb-6">Confirmation: {confirmation.confirmationNumber}</p>
            )}
            <p className="text-sm text-gray-500 mb-6">
              {scheduledDate === today
                ? 'Your payment is being processed.'
                : `Scheduled for ${new Date(scheduledDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}.`
              }
              {isRecurring && ` Repeats ${recurringRule}.`}
            </p>
            <button onClick={() => navigate('/bill-pay')} className="w-full py-4 bg-[#002D72] text-white font-bold text-sm tracking-widest rounded-full active:opacity-80">
              DONE
            </button>
          </div>
          <LegalDisclosure />
        </div>
      </div>
    );
  }

  if (step === 'confirm') {
    return (
      <div className="flex flex-col h-screen bg-gray-100 font-sans">
        <AppHeader showBackButton title="Confirm Payment" showSpacer />
        <div className="flex-1 pt-[64px] overflow-y-auto pb-24">
          <div className="mx-4 mt-4 bg-white rounded-2xl shadow-sm overflow-hidden">
            <Row label="Pay to"  value={payee?.nickname || payee?.name} />
            <Row label="Amount"  value={fmtUSD(parsedAmount)} />
            <Row label="From"    value={selectedAcct ? `${selectedAcct.accountName} ••••${selectedAcct.last4}` : ''} />
            <Row label="Date"    value={new Date(scheduledDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} />
            {memo && <Row label="Memo" value={memo} />}
            {isRecurring && <Row label="Repeats" value={RECURRING_OPTIONS.find(r => r.value === recurringRule)?.label || recurringRule} />}
            {isRecurring && recurringEndDate && <Row label="Ends" value={new Date(recurringEndDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} />}
          </div>
          {error && <p className="mx-4 mt-3 text-sm text-red-500">{error}</p>}
          <LegalDisclosure />
        </div>
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-gray-100 border-t border-gray-200 px-4 py-3">
          <div className="flex gap-3">
            <button onClick={() => setStep('form')} className="flex-1 py-4 bg-white border-2 border-[#002D72] text-[#002D72] font-bold text-sm tracking-widest rounded-full">EDIT</button>
            <button onClick={handleConfirm} disabled={submitting} className={`flex-1 py-4 font-bold text-sm tracking-widest rounded-full text-white bg-[#002D72] ${submitting ? 'opacity-50' : 'active:opacity-80'}`}>
              {submitting ? 'PROCESSING…' : 'CONFIRM'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Form step
  return (
    <div className="flex flex-col h-screen bg-gray-100 font-sans">
      <AppHeader showBackButton title={`Pay ${payee?.nickname || payee?.name || ''}`} showSpacer />
      <div className="flex-1 pt-[64px] overflow-y-auto pb-24">
        {error && <p className="px-4 pt-4 text-sm text-red-500">{error}</p>}

        {/* Amount */}
        <div className="mx-4 mt-4 bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-6 flex flex-col items-center">
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-3">Amount</p>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-light text-gray-400">$</span>
              <input
                type="number"
                min="0.01"
                step="0.01"
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
            <p className="text-base text-gray-500">From</p>
            <select
              value={fromAccountId}
              onChange={e => setFromAccountId(e.target.value)}
              className="text-base text-gray-900 font-medium bg-transparent outline-none text-right"
            >
              {accounts.map(a => (
                <option key={a._id} value={a._id}>{a.accountName} ••••{a.last4}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Date + frequency */}
        <div className="mx-4 mt-3 bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between border-b border-gray-100">
            <p className="text-base text-gray-500">Date</p>
            <input
              type="date"
              value={scheduledDate}
              min={today}
              onChange={e => setScheduledDate(e.target.value)}
              className="text-base text-gray-900 bg-transparent outline-none"
            />
          </div>
          <div className="px-5 py-4 flex items-center justify-between border-b border-gray-100">
            <p className="text-base text-gray-500">Frequency</p>
            <select
              value={recurringRule}
              onChange={e => setRecurringRule(e.target.value)}
              className="text-base text-gray-900 bg-transparent outline-none text-right"
            >
              {RECURRING_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          {recurringRule !== 'once' && (
            <div className="px-5 py-4 flex items-center justify-between">
              <p className="text-base text-gray-500">End Date</p>
              <input
                type="date"
                value={recurringEndDate}
                min={scheduledDate}
                onChange={e => setRecurringEndDate(e.target.value)}
                className="text-base text-gray-900 bg-transparent outline-none"
                placeholder="Optional"
              />
            </div>
          )}
        </div>

        {/* Memo */}
        <div className="mx-4 mt-3 bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 py-4">
            <input
              type="text"
              value={memo}
              onChange={e => setMemo(e.target.value)}
              placeholder="Memo (optional)"
              maxLength={140}
              className="w-full text-base text-gray-900 bg-transparent outline-none placeholder-gray-400"
            />
          </div>
        </div>

        <LegalDisclosure />
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 bg-gray-100 border-t border-gray-200 px-4 py-3">
        <div className="flex gap-3">
          <button onClick={() => navigate(-1)} className="flex-1 py-4 bg-white border-2 border-[#002D72] text-[#002D72] font-bold text-sm tracking-widest rounded-full">CANCEL</button>
          <button onClick={() => setStep('confirm')} disabled={!canContinue} className={`flex-1 py-4 font-bold text-sm tracking-widest rounded-full text-white bg-[#002D72] ${canContinue ? 'active:opacity-80' : 'opacity-50'}`}>
            CONTINUE
          </button>
        </div>
      </div>
    </div>
  );
}
