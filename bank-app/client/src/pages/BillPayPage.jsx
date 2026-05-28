import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import EricaSearchBar from '../components/EricaSearchBar';
import LegalDisclosure from '../components/LegalDisclosure';
import { api } from '../services/api';

const fmtUSD  = (n) => '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const STATUS_STYLES = {
  pending:    'bg-amber-50 text-amber-700 border-amber-200',
  processing: 'bg-blue-50 text-blue-700 border-blue-200',
  completed:  'bg-green-50 text-green-700 border-green-200',
  failed:     'bg-red-50 text-red-700 border-red-200',
  cancelled:  'bg-gray-100 text-gray-500 border-gray-200',
};

function StatusBadge({ status }) {
  return (
    <span className={`text-[11px] font-medium px-2 py-0.5 rounded border capitalize ${STATUS_STYLES[status] || STATUS_STYLES.cancelled}`}>
      {status}
    </span>
  );
}

const IconPlus = () => (
  <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
  </svg>
);

// Inline cancel confirmation — avoids window.confirm
function CancelConfirm({ onConfirm, onDismiss, loading }) {
  return (
    <div className="flex items-center gap-2 mt-1">
      <span className="text-xs text-gray-500">Cancel this payment?</span>
      <button
        type="button"
        onClick={onConfirm}
        disabled={loading}
        className="text-xs font-semibold text-red-600 active:opacity-70"
      >
        {loading ? 'Cancelling…' : 'Yes, cancel'}
      </button>
      <button
        type="button"
        onClick={onDismiss}
        className="text-xs text-gray-400 active:opacity-70"
      >
        Keep
      </button>
    </div>
  );
}

function Toast({ message, type = 'success', onDismiss }) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3500);
    return () => clearTimeout(t);
  }, [onDismiss]);

  const colors = {
    success: 'bg-green-700',
    error:   'bg-red-700',
    info:    'bg-[#002D72]',
  };

  return (
    <div className={`fixed top-[72px] left-4 right-4 z-50 ${colors[type] || colors.info} text-white text-sm font-medium px-4 py-3 rounded-xl shadow-lg`}>
      {message}
    </div>
  );
}

function PayTab({ navigate }) {
  const [payees,           setPayees]           = useState([]);
  const [upcoming,         setUpcoming]         = useState([]);
  const [loading,          setLoading]          = useState(true);
  const [error,            setError]            = useState('');
  const [confirmCancelId,  setConfirmCancelId]  = useState(null);
  const [cancellingId,     setCancellingId]     = useState(null);
  const [toast,            setToast]            = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [pRes, uRes] = await Promise.all([
        api.get('/bill-pay/payees'),
        api.get('/bill-pay/payments/upcoming'),
      ]);
      setPayees(pRes.data || []);
      setUpcoming(uRes.data || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleCancel = async (pmtId) => {
    setCancellingId(pmtId);
    try {
      await api.post(`/bill-pay/payments/${pmtId}/cancel`, {});
      setToast({ message: 'Payment cancelled.', type: 'info' });
      setConfirmCancelId(null);
      load();
    } catch (e) {
      setToast({ message: e.message || 'Could not cancel payment.', type: 'error' });
    } finally {
      setCancellingId(null);
    }
  };

  if (loading) return (
    <div className="p-8 space-y-3">
      {[1, 2, 3].map(n => <div key={n} className="h-4 bg-gray-100 rounded animate-pulse" />)}
    </div>
  );

  if (error) return (
    <div className="mx-4 mt-4 bg-red-50 border border-red-200 rounded-2xl px-5 py-4">
      <p className="text-sm text-red-600 mb-2">{error}</p>
      <button type="button" onClick={load} className="text-sm font-semibold text-red-600 underline">
        Try again
      </button>
    </div>
  );

  return (
    <div className="pb-10">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}

      {/* ── Payees ── */}
      <div className="mx-4 mt-4 bg-white rounded-2xl shadow-sm overflow-hidden">
        <div className="px-5 pt-5 pb-4 flex items-center justify-between">
          <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Payees</span>
          <button onClick={() => navigate('/add-payee')} className="flex items-center gap-2 active:opacity-70">
            <span className="text-[#1a6bbf] font-semibold text-base">Add Payee</span>
            <div className="w-6 h-6 rounded-full bg-[#1a6bbf] flex items-center justify-center flex-shrink-0">
              <IconPlus />
            </div>
          </button>
        </div>
        <div className="px-5 pb-5">
          {payees.length === 0 ? (
            <div className="py-2">
              <p className="text-base text-gray-700 leading-snug mb-1">Ready to make a payment?</p>
              <p className="text-sm text-gray-500">Add a payee to get started. You can search by company name or add one manually.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {payees.map((p) => (
                <li key={p._id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-base text-gray-900 font-medium">{p.nickname || p.name}</p>
                    {p.nickname && <p className="text-xs text-gray-400">{p.name}</p>}
                    <p className="text-xs text-gray-400 capitalize">{p.category}</p>
                  </div>
                  <button
                    onClick={() => navigate(`/pay-bill?payeeId=${p._id}`)}
                    className="text-[#1a6bbf] text-sm font-semibold active:opacity-70"
                  >
                    Pay
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* ── Upcoming payments ── */}
      {upcoming.length > 0 && (
        <div className="mx-4 mt-4 bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 pt-5 pb-2">
            <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-widest">Upcoming</span>
          </div>
          <ul className="divide-y divide-gray-100 px-5 pb-3">
            {upcoming.map((pmt) => (
              <li key={pmt._id} className="py-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-base text-gray-900">{pmt.payee?.nickname || pmt.payee?.name}</p>
                    <p className="text-xs text-gray-400">
                      {fmtDate(pmt.scheduledDate)}
                      {pmt.isRecurring ? ` · ${pmt.recurringRule}` : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-base font-semibold text-gray-900">{fmtUSD(pmt.amount)}</p>
                    {confirmCancelId !== pmt._id && (
                      <button
                        onClick={() => setConfirmCancelId(pmt._id)}
                        className="text-xs text-red-500 active:opacity-70"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
                {confirmCancelId === pmt._id && (
                  <CancelConfirm
                    loading={cancellingId === pmt._id}
                    onConfirm={() => handleCancel(pmt._id)}
                    onDismiss={() => setConfirmCancelId(null)}
                  />
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function ActivityTab() {
  const [payments,  setPayments]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [page,      setPage]      = useState(1);
  const [total,     setTotal]     = useState(0);
  const [toast,     setToast]     = useState(null);
  const limit = 20;

  const load = useCallback(async (p) => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/bill-pay/payments?page=${p}&limit=${limit}`);
      setPayments(res.data || []);
      setTotal(res.pagination?.total || 0);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(page); }, [page, load]);

  const totalPages = Math.ceil(total / limit);

  if (loading) return (
    <div className="p-8 space-y-3">
      {[1, 2, 3].map(n => <div key={n} className="h-4 bg-gray-100 rounded animate-pulse" />)}
    </div>
  );

  if (error) return (
    <div className="mx-4 mt-4 bg-red-50 border border-red-200 rounded-2xl px-5 py-4">
      <p className="text-sm text-red-600 mb-2">{error}</p>
      <button type="button" onClick={() => load(page)} className="text-sm font-semibold text-red-600 underline">
        Try again
      </button>
    </div>
  );

  return (
    <div className="pb-10">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onDismiss={() => setToast(null)}
        />
      )}
      <div className="mx-4 mt-4 bg-white rounded-2xl shadow-sm overflow-hidden">
        {payments.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <p className="text-base font-medium text-gray-700 mb-1">No payment history yet</p>
            <p className="text-sm text-gray-400">Your bill payment activity will appear here.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-100">
            {payments.map((pmt) => (
              <li key={pmt._id} className="px-5 py-4 flex items-center justify-between">
                <div className="flex-1 min-w-0 pr-3">
                  <p className="text-base text-gray-900 font-medium truncate">
                    {pmt.payee?.nickname || pmt.payee?.name}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5">{fmtDate(pmt.scheduledDate)}</p>
                  <p className="text-[11px] text-gray-300 font-mono mt-0.5">{pmt.confirmationNumber}</p>
                  {pmt.status === 'failed' && pmt.failureReason && (
                    <p className="text-[11px] text-red-400 mt-0.5">{pmt.failureReason}</p>
                  )}
                </div>
                <div className="text-right flex flex-col items-end gap-1.5 flex-shrink-0">
                  <p className="text-base font-semibold text-gray-900">{fmtUSD(pmt.amount)}</p>
                  <StatusBadge status={pmt.status} />
                </div>
              </li>
            ))}
          </ul>
        )}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-400">Page {page} of {totalPages} · {total} total</p>
            <div className="flex gap-3">
              <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
                className="text-xs font-semibold text-[#1a6bbf] disabled:opacity-40">
                ← Prev
              </button>
              <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
                className="text-xs font-semibold text-[#1a6bbf] disabled:opacity-40">
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BillPayPage() {
  const navigate   = useNavigate();
  const [activeTab, setActiveTab] = useState('pay');

  const tabs = [
    { key: 'pay',      label: 'Pay' },
    { key: 'activity', label: 'Activity' },
  ];

  return (
    <div className="flex flex-col h-screen bg-gray-100 font-sans">
      <AppHeader showBackButton title="Bill Pay" showSpacer />
      <div className="flex flex-col flex-1 pt-[64px] overflow-hidden">
        <div className="bg-gray-100 px-4 py-3">
          <EricaSearchBar ericaCount={4} bgWhite={false} />
        </div>
        <div className="bg-white flex-shrink-0">
          <div className="flex">
            {tabs.map((t) => (
              <button
                key={t.key}
                onClick={() => setActiveTab(t.key)}
                className={`flex-1 py-3.5 text-sm font-medium tracking-wide border-b-2 transition-colors ${
                  activeTab === t.key ? 'text-[#C0392B] border-[#C0392B]' : 'text-gray-400 border-transparent'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto pb-8">
          {activeTab === 'pay'      && <PayTab navigate={navigate} />}
          {activeTab === 'activity' && <ActivityTab />}
          <LegalDisclosure />
        </div>
      </div>
    </div>
  );
}
