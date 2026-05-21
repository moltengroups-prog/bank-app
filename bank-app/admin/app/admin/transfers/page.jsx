'use client';
import { useEffect, useState, useCallback } from 'react';
import AdminTopbar from '../../../components/AdminTopbar.jsx';
import AdminBadge from '../../../components/AdminBadge.jsx';
import { transfersService, wireService } from '../../../services/adminService.js';

function ConfirmModal({ title, message, placeholder, onConfirm, onCancel, loading }) {
  const [value, setValue] = useState('');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 p-6">
        <h3 className="text-base font-semibold text-slate-800 mb-1">{title}</h3>
        <p className="text-sm text-slate-500 mb-4">{message}</p>
        {placeholder && (
          <textarea
            className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-400 resize-none mb-4"
            rows={3}
            placeholder={placeholder}
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        )}
        <div className="flex gap-2 justify-end">
          <button onClick={onCancel} className="px-4 py-2 text-xs text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50">
            Cancel
          </button>
          <button
            onClick={() => onConfirm(value)}
            disabled={loading || (placeholder && !value.trim())}
            className="px-4 py-2 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Processing…' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
}

const fmtDate = (d) => d ? new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
const fmtUSD  = (n) => n == null ? '—' : '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const TYPES      = ['', 'debit', 'credit'];
const STATUSES   = ['', 'completed', 'pending', 'failed'];
const WIRE_STATS = ['', 'processing', 'pending-review', 'completed', 'rejected', 'blocked', 'cancelled'];

function WireStatusBadge({ status }) {
  const map = {
    'pending-review': 'bg-amber-50 text-amber-800 border-amber-300',
    'processing':     'bg-blue-50 text-blue-700 border-blue-300',
    'completed':      'bg-green-50 text-green-800 border-green-300',
    'rejected':       'bg-slate-100 text-slate-600 border-slate-300',
    'blocked':        'bg-red-50 text-red-800 border-red-300',
    'cancelled':      'bg-slate-100 text-slate-500 border-slate-200',
  };
  return (
    <span className={`text-[11px] font-medium px-2 py-0.5 rounded border capitalize whitespace-nowrap ${map[status] || map.cancelled}`}>
      {status}
    </span>
  );
}

export default function TransfersPage() {
  const [activeTab,   setActiveTab]   = useState('transfers');

  // Internal transfers
  const [transfers,   setTransfers]   = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [page,        setPage]        = useState(1);
  const [total,       setTotal]       = useState(0);
  const [filters,     setFilters]     = useState({ type: '', status: '' });

  // Wire transfers
  const [wires,       setWires]       = useState([]);
  const [wireLoading, setWireLoading] = useState(false);
  const [wirePage,    setWirePage]    = useState(1);
  const [wireTotal,   setWireTotal]   = useState(0);
  const [wireFilters, setWireFilters] = useState({ status: '' });

  // Action modals
  const [modal,       setModal]       = useState(null); // { type: 'settle'|'reverse', id, label }
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError,   setActionError]   = useState('');

  const limit = 30;

  const fetchTransfers = useCallback(async (p, f) => {
    setLoading(true);
    try {
      const res = await transfersService.getTransfers({ page: p, limit, ...f });
      setTransfers(res?.data || []);
      setTotal(res?.pagination?.total || 0);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchWires = useCallback(async (p, f) => {
    setWireLoading(true);
    try {
      const res = await wireService.getHistory({ page: p, limit, ...f });
      setWires(res?.data || []);
      setWireTotal(res?.pagination?.total || 0);
    } finally {
      setWireLoading(false);
    }
  }, []);

  useEffect(() => { fetchTransfers(page, filters); }, [page, filters, fetchTransfers]);
  useEffect(() => { if (activeTab === 'wires') fetchWires(wirePage, wireFilters); }, [activeTab, wirePage, wireFilters, fetchWires]);

  const totalPages     = Math.ceil(total / limit);
  const wireTotalPages = Math.ceil(wireTotal / limit);
  const setFilter     = (key, val) => { setFilters((f) => ({ ...f, [key]: val })); setPage(1); };
  const setWireFilter = (key, val) => { setWireFilters((f) => ({ ...f, [key]: val })); setWirePage(1); };

  const handleAction = async (reason) => {
    if (!modal) return;
    setActionLoading(true);
    setActionError('');
    try {
      if (modal.type === 'settle') {
        await wireService.settle(modal.id, reason);
        setWires((prev) => prev.map((w) => w._id === modal.id ? { ...w, status: 'completed' } : w));
      } else if (modal.type === 'reverse') {
        await transfersService.reverse(modal.id, reason);
        setTransfers((prev) => prev.map((tx) => tx.id === modal.id ? { ...tx, status: 'reversed' } : tx));
      }
      setModal(null);
    } catch (err) {
      setActionError(err?.message || 'Action failed. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {modal && (
        <ConfirmModal
          title={modal.type === 'settle' ? 'Settle Wire Transfer' : 'Reverse Transaction'}
          message={modal.type === 'settle'
            ? `Mark wire ${modal.label} as completed. This cannot be undone.`
            : `Reverse transaction ${modal.label}. Funds will be returned to the original account.`
          }
          placeholder={modal.type === 'settle' ? 'Optional notes…' : 'Reason for reversal (required)'}
          loading={actionLoading}
          onConfirm={handleAction}
          onCancel={() => { setModal(null); setActionError(''); }}
        />
      )}
      {actionError && (
        <div className="fixed bottom-4 right-4 z-50 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg px-4 py-3 shadow-lg">
          {actionError}
          <button onClick={() => setActionError('')} className="ml-3 text-red-400 hover:text-red-700">✕</button>
        </div>
      )}
      <AdminTopbar
        title="Transfer Monitoring"
        subtitle={`${(activeTab === 'transfers' ? total : wireTotal).toLocaleString()} records`}
      />

      {/* Tab bar */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center gap-0">
        {[
          { key: 'transfers', label: 'Internal Transfers' },
          { key: 'wires',     label: 'Wire Transfers'     },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className={`px-4 py-3 text-xs font-medium border-b-2 transition-colors -mb-px ${
              activeTab === t.key
                ? 'border-blue-500 text-blue-700'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Filter bar */}
      {activeTab === 'transfers' && (
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-2.5 flex items-center gap-2 flex-wrap">
        <span className="text-xs text-slate-500 font-medium mr-1 hidden sm:inline">Filter:</span>
        <select
          value={filters.type}
          onChange={(e) => setFilter('type', e.target.value)}
          className="text-xs border border-slate-200 rounded px-2.5 py-1.5 bg-white focus:outline-none focus:border-blue-400"
          aria-label="Filter by type"
        >
          {TYPES.map((t) => <option key={t} value={t}>{t || 'All Types'}</option>)}
        </select>
        <select
          value={filters.status}
          onChange={(e) => setFilter('status', e.target.value)}
          className="text-xs border border-slate-200 rounded px-2.5 py-1.5 bg-white focus:outline-none focus:border-blue-400"
          aria-label="Filter by status"
        >
          {STATUSES.map((s) => <option key={s} value={s}>{s || 'All Statuses'}</option>)}
        </select>
        {(filters.type || filters.status) && (
          <button
            onClick={() => { setFilters({ type: '', status: '' }); setPage(1); }}
            className="text-xs text-slate-400 hover:text-slate-700 transition-colors px-1"
          >
            Clear
          </button>
        )}
      </div>
      )}

      {activeTab === 'wires' && (
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-2.5 flex items-center gap-2 flex-wrap">
        <span className="text-xs text-slate-500 font-medium mr-1 hidden sm:inline">Filter:</span>
        <select
          value={wireFilters.status}
          onChange={(e) => setWireFilter('status', e.target.value)}
          className="text-xs border border-slate-200 rounded px-2.5 py-1.5 bg-white focus:outline-none focus:border-blue-400"
          aria-label="Filter by status"
        >
          {WIRE_STATS.map((s) => <option key={s} value={s}>{s || 'All Statuses'}</option>)}
        </select>
        {wireFilters.status && (
          <button
            onClick={() => { setWireFilters({ status: '' }); setWirePage(1); }}
            className="text-xs text-slate-400 hover:text-slate-700 transition-colors px-1"
          >
            Clear
          </button>
        )}
      </div>
      )}

      <div className="p-4 sm:p-6">

        {/* ── Internal Transfers ── */}
        {activeTab === 'transfers' && (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-sm text-slate-400">Loading…</div>
          ) : transfers.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">No transfers found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm admin-table min-w-[520px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">Date</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">User</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Description</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Account</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Type</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Amount</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Ref</th>
                    <th className="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {transfers.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-4 py-3 text-xs text-slate-500 whitespace-nowrap">{fmtDate(tx.transactionDate)}</td>
                      <td className="px-4 py-3">
                        <p className="text-xs font-medium text-slate-800 whitespace-nowrap">
                          {tx.user ? `${tx.user.firstName} ${tx.user.lastName}` : '—'}
                        </p>
                        <p className="text-[11px] text-slate-400 truncate max-w-[100px] sm:max-w-[140px]">{tx.user?.email}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600 max-w-[180px] truncate hidden md:table-cell">{tx.description}</td>
                      <td className="px-4 py-3 text-xs text-slate-500 hidden lg:table-cell">{tx.account?.maskedNumber || '—'}</td>
                      <td className="px-4 py-3"><AdminBadge label={tx.type} variant={tx.type} /></td>
                      <td className="px-4 py-3"><AdminBadge label={tx.status} variant={tx.status} /></td>
                      <td className="px-4 py-3 text-right">
                        <span className={`text-xs font-semibold whitespace-nowrap ${tx.type === 'credit' ? 'text-green-600' : 'text-slate-700'}`}>
                          {tx.type === 'credit' ? '+' : '-'}{fmtUSD(tx.amount)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[10px] text-slate-400 font-mono hidden lg:table-cell">{tx.referenceNumber?.slice(-8)}</td>
                      <td className="px-4 py-3">
                        {tx.status === 'completed' && (
                          <button
                            onClick={() => setModal({ type: 'reverse', id: tx.id, label: tx.referenceNumber?.slice(-8) || tx.id })}
                            className="text-[11px] px-2.5 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50 transition-colors whitespace-nowrap"
                          >
                            Reverse
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50 flex-wrap gap-2">
              <p className="text-xs text-slate-500">Page {page} of {totalPages} · {total} records</p>
              <div className="flex items-center gap-1">
                <button disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="px-2.5 py-1 text-xs border border-slate-200 rounded disabled:opacity-40 hover:bg-white">← Prev</button>
                <button disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)} className="px-2.5 py-1 text-xs border border-slate-200 rounded disabled:opacity-40 hover:bg-white">Next →</button>
              </div>
            </div>
          )}
        </div>
        )}

        {/* ── Wire Transfers ── */}
        {activeTab === 'wires' && (
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          {wireLoading ? (
            <div className="p-8 text-center text-sm text-slate-400">Loading…</div>
          ) : wires.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">No wire transfers found</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs min-w-[620px]">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50">
                    <th className="text-left px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Date</th>
                    <th className="text-left px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Customer</th>
                    <th className="text-left px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Recipient</th>
                    <th className="text-left px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Amount</th>
                    <th className="text-left px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                    <th className="text-left px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Risk</th>
                    <th className="px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Ref</th>
                    <th className="px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {wires.map((w) => {
                    const rName = [w.recipient?.firstName, w.recipient?.lastName, w.recipient?.businessName].filter(Boolean).join(' ') || '—';
                    const riskColor = w.riskScore >= 70 ? 'text-red-600' : w.riskScore >= 40 ? 'text-amber-600' : 'text-slate-500';
                    return (
                      <tr key={w._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{fmtDate(w.submittedAt)}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium text-slate-800 truncate max-w-[110px]">
                            {w.user ? `${w.user.firstName} ${w.user.lastName}` : '—'}
                          </p>
                          <p className="text-[10px] text-slate-400 truncate max-w-[110px]">{w.user?.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-slate-700 truncate max-w-[120px]">{rName}</p>
                          <p className="text-[10px] text-slate-400">{w.recipient?.country} · {w.recipient?.accountNumberMasked}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="font-bold text-slate-900 whitespace-nowrap">{fmtUSD(w.amount)}</p>
                          {w.fee > 0 && <p className="text-[10px] text-slate-400">+{fmtUSD(w.fee)} fee</p>}
                        </td>
                        <td className="px-4 py-3"><WireStatusBadge status={w.status} /></td>
                        <td className="px-4 py-3 hidden md:table-cell">
                          <span className={`text-xs font-semibold ${riskColor}`}>{w.riskScore}</span>
                          <span className="text-[10px] text-slate-400 ml-1">{w.riskLevel}</span>
                        </td>
                        <td className="px-4 py-3 text-[10px] text-slate-400 font-mono hidden lg:table-cell">{w.referenceNumber?.slice(-10)}</td>
                        <td className="px-4 py-3">
                          {w.status === 'processing' && (
                            <button
                              onClick={() => setModal({ type: 'settle', id: w._id, label: w.referenceNumber?.slice(-10) || w._id })}
                              className="text-[11px] px-2.5 py-1 rounded border border-green-200 text-green-700 hover:bg-green-50 transition-colors whitespace-nowrap"
                            >
                              Settle
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {wireTotalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50 flex-wrap gap-2">
              <p className="text-xs text-slate-500">Page {wirePage} of {wireTotalPages} · {wireTotal} records</p>
              <div className="flex items-center gap-1">
                <button disabled={wirePage <= 1} onClick={() => setWirePage((p) => p - 1)} className="px-2.5 py-1 text-xs border border-slate-200 rounded disabled:opacity-40 hover:bg-white">← Prev</button>
                <button disabled={wirePage >= wireTotalPages} onClick={() => setWirePage((p) => p + 1)} className="px-2.5 py-1 text-xs border border-slate-200 rounded disabled:opacity-40 hover:bg-white">Next →</button>
              </div>
            </div>
          )}
        </div>
        )}

      </div>
    </div>
  );
}
