'use client';
import { useEffect, useState, useCallback } from 'react';
import AdminTopbar from '../../../components/AdminTopbar.jsx';
import { billPayAdminService } from '../../../services/adminService.js';

const fmtDate = (d) => d ? new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
const fmtUSD  = (n) => n == null ? '—' : '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const STATUS_STYLES = {
  pending:    'bg-amber-50 text-amber-800 border-amber-300',
  processing: 'bg-blue-50 text-blue-700 border-blue-300',
  completed:  'bg-green-50 text-green-800 border-green-300',
  failed:     'bg-red-50 text-red-800 border-red-300',
  cancelled:  'bg-slate-100 text-slate-500 border-slate-200',
};

function StatusBadge({ status }) {
  return (
    <span className={`text-[11px] font-medium px-2 py-0.5 rounded border capitalize whitespace-nowrap ${STATUS_STYLES[status] || STATUS_STYLES.cancelled}`}>
      {status}
    </span>
  );
}

function RefundModal({ payment, onConfirm, onCancel, loading }) {
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
        <h3 className="text-base font-semibold text-slate-800 mb-1">Refund Payment</h3>
        <p className="text-sm text-slate-500 mb-4">
          Refund ${Number(payment?.amount).toFixed(2)} to {payment?.user?.firstName} {payment?.user?.lastName} for {payment?.payee?.name}
        </p>
        <textarea
          className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 resize-none mb-4"
          rows={3}
          placeholder="Reason for refund…"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="px-4 py-2 text-xs text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
          <button
            onClick={() => onConfirm(reason)}
            disabled={loading || !reason.trim()}
            className="px-4 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Processing…' : 'Refund'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BillPayAdminPage() {
  const [activeTab,   setActiveTab]   = useState('all');
  const [payments,    setPayments]    = useState([]);
  const [failed,      setFailed]      = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [page,        setPage]        = useState(1);
  const [total,       setTotal]       = useState(0);
  const [statusFilter,setStatusFilter]= useState('');
  const [refundTarget,setRefundTarget]= useState(null);
  const [actionLoading,setActionLoading] = useState(false);
  const [toast,       setToast]       = useState('');
  const limit = 30;

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const fetchAll = useCallback(async (p, sf) => {
    setLoading(true);
    try {
      const params = { page: p, limit };
      if (sf) params.status = sf;
      const res = await billPayAdminService.getPayments(params);
      setPayments(res?.data || []);
      setTotal(res?.pagination?.total || 0);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  const fetchFailed = useCallback(async () => {
    setLoading(true);
    try {
      const res = await billPayAdminService.getFailedPayments();
      setFailed(res?.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    if (activeTab === 'all')    fetchAll(page, statusFilter);
    if (activeTab === 'failed') fetchFailed();
  }, [activeTab, page, statusFilter, fetchAll, fetchFailed]);

  const handleRetry = async (id) => {
    setActionLoading(true);
    try {
      await billPayAdminService.retryPayment(id);
      showToast('Payment retried successfully.');
      fetchFailed();
    } catch (e) { showToast(e.message || 'Retry failed.'); }
    finally { setActionLoading(false); }
  };

  const handleRefund = async (reason) => {
    if (!refundTarget || !reason.trim()) return;
    setActionLoading(true);
    try {
      await billPayAdminService.refundPayment(refundTarget._id, reason);
      showToast('Refund processed.');
      setRefundTarget(null);
      if (activeTab === 'all') fetchAll(page, statusFilter);
    } catch (e) { showToast(e.message || 'Refund failed.'); }
    finally { setActionLoading(false); }
  };

  const totalPages = Math.ceil(total / limit);

  const STATUSES = ['', 'pending', 'processing', 'completed', 'failed', 'cancelled'];

  return (
    <div className="flex-1 overflow-y-auto">
      {refundTarget && (
        <RefundModal
          payment={refundTarget}
          loading={actionLoading}
          onConfirm={handleRefund}
          onCancel={() => setRefundTarget(null)}
        />
      )}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50 bg-slate-800 text-white text-xs rounded-lg px-4 py-3 shadow-lg">{toast}</div>
      )}

      <AdminTopbar
        title="Bill Pay"
        subtitle={`${(activeTab === 'all' ? total : failed.length).toLocaleString()} records`}
      />

      {/* Tabs */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center gap-0">
        {[{ key: 'all', label: 'All Payments' }, { key: 'failed', label: 'Failed' }].map((t) => (
          <button
            key={t.key}
            onClick={() => { setActiveTab(t.key); setPage(1); }}
            className={`px-4 py-3 text-xs font-medium border-b-2 transition-colors -mb-px ${
              activeTab === t.key ? 'border-blue-500 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
            {t.key === 'failed' && failed.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 text-[10px] bg-red-100 text-red-700 rounded-full">{failed.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* Filter bar — all tab only */}
      {activeTab === 'all' && (
        <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-2.5 flex items-center gap-2">
          <span className="text-xs text-slate-500 font-medium mr-1 hidden sm:inline">Filter:</span>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="text-xs border border-slate-200 rounded px-2.5 py-1.5 bg-white focus:outline-none focus:border-blue-400"
          >
            {STATUSES.map((s) => <option key={s} value={s}>{s || 'All Statuses'}</option>)}
          </select>
          {statusFilter && (
            <button onClick={() => { setStatusFilter(''); setPage(1); }} className="text-xs text-slate-400 hover:text-slate-700 px-1">Clear</button>
          )}
        </div>
      )}

      <div className="p-4 sm:p-6">
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-sm text-slate-400">Loading…</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-xs min-w-[600px]">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <th className="text-left px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Date</th>
                      <th className="text-left px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Customer</th>
                      <th className="text-left px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Payee</th>
                      <th className="text-left px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Amount</th>
                      <th className="text-left px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                      <th className="text-left px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Scheduled</th>
                      <th className="px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {(activeTab === 'all' ? payments : failed).map((pmt) => (
                      <tr key={pmt._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{fmtDate(pmt.createdAt)}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-800">{pmt.user ? `${pmt.user.firstName} ${pmt.user.lastName}` : '—'}</p>
                          <p className="text-[10px] text-slate-400 truncate max-w-[120px]">{pmt.user?.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-slate-700">{pmt.payee?.nickname || pmt.payee?.name || '—'}</p>
                          {pmt.payee?.nickname && <p className="text-[10px] text-slate-400">{pmt.payee.name}</p>}
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-900 whitespace-nowrap">{fmtUSD(pmt.amount)}</td>
                        <td className="px-4 py-3"><StatusBadge status={pmt.status} /></td>
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap hidden md:table-cell">{fmtDate(pmt.scheduledDate)}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1.5">
                            {pmt.status === 'failed' && (
                              <button
                                onClick={() => handleRetry(pmt._id)}
                                disabled={actionLoading}
                                className="text-[11px] px-2.5 py-1 rounded border border-blue-200 text-blue-600 hover:bg-blue-50 transition-colors disabled:opacity-50"
                              >
                                Retry
                              </button>
                            )}
                            {pmt.status === 'completed' && !pmt.refundedAt && (
                              <button
                                onClick={() => setRefundTarget(pmt)}
                                className="text-[11px] px-2.5 py-1 rounded border border-amber-200 text-amber-700 hover:bg-amber-50 transition-colors"
                              >
                                Refund
                              </button>
                            )}
                            {pmt.refundedAt && (
                              <span className="text-[11px] text-slate-400">Refunded</span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                    {(activeTab === 'all' ? payments : failed).length === 0 && (
                      <tr><td colSpan={7} className="px-4 py-8 text-center text-slate-400">No payments found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {activeTab === 'all' && totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50 flex-wrap gap-2">
                  <p className="text-xs text-slate-500">Page {page} of {totalPages} · {total} records</p>
                  <div className="flex items-center gap-1">
                    <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-2.5 py-1 text-xs border border-slate-200 rounded disabled:opacity-40 hover:bg-white">← Prev</button>
                    <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-2.5 py-1 text-xs border border-slate-200 rounded disabled:opacity-40 hover:bg-white">Next →</button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
