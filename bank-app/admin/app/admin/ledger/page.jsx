'use client';
import { useEffect, useState, useCallback } from 'react';
import AdminTopbar from '../../../components/AdminTopbar.jsx';
import { ledgerService } from '../../../services/adminService.js';

const fmtDate = (d) => d ? new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
const fmtUSD  = (n) => n == null ? '—' : '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function LedgerPage() {
  const [entries,   setEntries]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [page,      setPage]      = useState(1);
  const [total,     setTotal]     = useState(0);
  const [typeFilter,setTypeFilter]= useState('');
  const [accountId, setAccountId] = useState('');
  const limit = 30;

  const fetchEntries = useCallback(async (p, t, a) => {
    setLoading(true);
    try {
      const params = { page: p, limit };
      if (t) params.type      = t;
      if (a) params.accountId = a;
      const res = await ledgerService.getEntries(params);
      setEntries(res?.data || []);
      setTotal(res?.pagination?.total || 0);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchEntries(page, typeFilter, accountId); }, [page, typeFilter, accountId, fetchEntries]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="flex-1 overflow-y-auto">
      <AdminTopbar title="Ledger Explorer" subtitle={`${total.toLocaleString()} entries`} />

      {/* Filters */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-2.5 flex items-center gap-2 flex-wrap">
        <span className="text-xs text-slate-500 font-medium mr-1 hidden sm:inline">Filter:</span>
        <select
          value={typeFilter}
          onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
          className="text-xs border border-slate-200 rounded px-2.5 py-1.5 bg-white focus:outline-none focus:border-blue-400"
        >
          <option value="">All Types</option>
          <option value="debit">Debit</option>
          <option value="credit">Credit</option>
        </select>
        {(typeFilter) && (
          <button onClick={() => { setTypeFilter(''); setPage(1); }} className="text-xs text-slate-400 hover:text-slate-700 px-1">Clear</button>
        )}
      </div>

      <div className="p-4 sm:p-6">
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-sm text-slate-400">Loading…</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-xs min-w-[700px]">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <th className="text-left px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Time</th>
                      <th className="text-left px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Account</th>
                      <th className="text-left px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wide">User</th>
                      <th className="text-left px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Type</th>
                      <th className="text-right px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Amount</th>
                      <th className="text-right px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Balance Before</th>
                      <th className="text-right px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Balance After</th>
                      <th className="text-left px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Description</th>
                      <th className="text-left px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Ref</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {entries.map((entry) => (
                      <tr key={entry._id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-4 py-3 text-slate-500 whitespace-nowrap font-mono text-[10px]">{fmtDate(entry.createdAt)}</td>
                        <td className="px-4 py-3">
                          <p className="text-slate-800">{entry.account?.accountName || '—'}</p>
                          <p className="text-[10px] text-slate-400">••••{entry.account?.last4} · {entry.account?.accountType}</p>
                        </td>
                        <td className="px-4 py-3">
                          <p className="text-slate-700 truncate max-w-[110px]">{entry.user ? `${entry.user.firstName} ${entry.user.lastName}` : '—'}</p>
                          <p className="text-[10px] text-slate-400 truncate max-w-[110px]">{entry.user?.email}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[11px] font-semibold px-2 py-0.5 rounded ${entry.type === 'credit' ? 'text-green-700 bg-green-50' : 'text-red-700 bg-red-50'}`}>
                            {entry.type}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-bold whitespace-nowrap">
                          <span className={entry.type === 'credit' ? 'text-green-700' : 'text-slate-800'}>
                            {entry.type === 'credit' ? '+' : '-'}{fmtUSD(entry.amount)}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-slate-500 hidden md:table-cell">{fmtUSD(entry.balanceBefore)}</td>
                        <td className="px-4 py-3 text-right text-slate-800 font-medium hidden md:table-cell">{fmtUSD(entry.balanceAfter)}</td>
                        <td className="px-4 py-3 text-slate-600 max-w-[160px] truncate hidden lg:table-cell">{entry.description || '—'}</td>
                        <td className="px-4 py-3 font-mono text-[10px] text-slate-400 hidden lg:table-cell">{entry.transactionId?.referenceNumber?.slice(-8) || '—'}</td>
                      </tr>
                    ))}
                    {entries.length === 0 && (
                      <tr><td colSpan={9} className="px-4 py-8 text-center text-slate-400">No ledger entries found</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50 flex-wrap gap-2">
                  <p className="text-xs text-slate-500">Page {page} of {totalPages} · {total} entries</p>
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
