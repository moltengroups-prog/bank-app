'use client';
import { useEffect, useState, useCallback } from 'react';
import AdminTopbar from '../../../components/AdminTopbar.jsx';
import { auditService } from '../../../services/adminService.js';

const fmtDate = (d) => d ? new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '—';

const SEVERITY_STYLES = {
  info:     'bg-slate-100 text-slate-600 border-slate-200',
  warning:  'bg-amber-50 text-amber-800 border-amber-300',
  critical: 'bg-red-50 text-red-800 border-red-300',
};

function SeverityBadge({ severity }) {
  return (
    <span className={`text-[11px] font-medium px-2 py-0.5 rounded border capitalize whitespace-nowrap ${SEVERITY_STYLES[severity] || SEVERITY_STYLES.info}`}>
      {severity}
    </span>
  );
}

const SEVERITIES = ['', 'info', 'warning', 'critical'];

export default function AuditLogsPage() {
  const [logs,      setLogs]      = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [page,      setPage]      = useState(1);
  const [total,     setTotal]     = useState(0);
  const [severity,  setSeverity]  = useState('');
  const [action,    setAction]    = useState('');
  const [expanded,  setExpanded]  = useState(null);
  const limit = 30;

  const fetchLogs = useCallback(async (p, s, a) => {
    setLoading(true);
    try {
      const params = { page: p, limit };
      if (s) params.severity = s;
      if (a) params.action   = a;
      const res = await auditService.getLogs(params);
      setLogs(res?.data || []);
      setTotal(res?.pagination?.total || 0);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchLogs(page, severity, action); }, [page, severity, action, fetchLogs]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="flex-1 overflow-y-auto">
      <AdminTopbar title="Audit Logs" subtitle={`${total.toLocaleString()} entries`} />

      {/* Filters */}
      <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-2.5 flex items-center gap-2 flex-wrap">
        <span className="text-xs text-slate-500 font-medium mr-1 hidden sm:inline">Filter:</span>
        <select
          value={severity}
          onChange={(e) => { setSeverity(e.target.value); setPage(1); }}
          className="text-xs border border-slate-200 rounded px-2.5 py-1.5 bg-white focus:outline-none focus:border-blue-400"
        >
          {SEVERITIES.map((s) => <option key={s} value={s}>{s || 'All Severities'}</option>)}
        </select>
        <input
          type="text"
          value={action}
          onChange={(e) => { setAction(e.target.value); setPage(1); }}
          placeholder="Filter by action…"
          className="text-xs border border-slate-200 rounded px-2.5 py-1.5 bg-white focus:outline-none focus:border-blue-400 w-48"
        />
        {(severity || action) && (
          <button onClick={() => { setSeverity(''); setAction(''); setPage(1); }} className="text-xs text-slate-400 hover:text-slate-700 px-1">Clear</button>
        )}
      </div>

      <div className="p-4 sm:p-6">
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
          {loading ? (
            <div className="p-8 text-center text-sm text-slate-400">Loading…</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-xs min-w-[680px]">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50">
                      <th className="text-left px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">Time</th>
                      <th className="text-left px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Actor</th>
                      <th className="text-left px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Action</th>
                      <th className="text-left px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Severity</th>
                      <th className="text-left px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wide hidden lg:table-cell">Target</th>
                      <th className="px-4 py-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Detail</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {logs.map((log) => (
                      <>
                        <tr key={log._id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-4 py-3 text-slate-500 whitespace-nowrap font-mono text-[10px]">{fmtDate(log.createdAt)}</td>
                          <td className="px-4 py-3">
                            <p className="text-slate-800 font-medium truncate max-w-[110px]">{log.actorEmail || 'system'}</p>
                            <p className="text-[10px] text-slate-400 capitalize">{log.actorRole}</p>
                          </td>
                          <td className="px-4 py-3 font-mono text-slate-700 max-w-[160px] truncate">{log.action}</td>
                          <td className="px-4 py-3"><SeverityBadge severity={log.severity} /></td>
                          <td className="px-4 py-3 hidden lg:table-cell text-slate-500 truncate max-w-[120px]">
                            {log.targetUser?.email || log.targetUser?.firstName || '—'}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <button
                              onClick={() => setExpanded(expanded === log._id ? null : log._id)}
                              className="text-[11px] text-blue-500 hover:text-blue-700"
                            >
                              {expanded === log._id ? 'Hide' : 'View'}
                            </button>
                          </td>
                        </tr>
                        {expanded === log._id && (
                          <tr key={log._id + '_exp'} className="bg-slate-50 border-b border-slate-100">
                            <td colSpan={6} className="px-4 py-3">
                              <div className="grid grid-cols-2 gap-4 text-[11px]">
                                {log.ipAddress && <div><span className="text-slate-400">IP: </span><span className="font-mono text-slate-700">{log.ipAddress}</span></div>}
                                {log.beforeState && (
                                  <div>
                                    <span className="text-slate-400">Before: </span>
                                    <span className="font-mono text-slate-700">{JSON.stringify(log.beforeState)}</span>
                                  </div>
                                )}
                                {log.afterState && (
                                  <div>
                                    <span className="text-slate-400">After: </span>
                                    <span className="font-mono text-slate-700">{JSON.stringify(log.afterState)}</span>
                                  </div>
                                )}
                                {log.metadata && Object.keys(log.metadata).length > 0 && (
                                  <div className="col-span-2">
                                    <span className="text-slate-400">Metadata: </span>
                                    <span className="font-mono text-slate-600 break-all">{JSON.stringify(log.metadata)}</span>
                                  </div>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                    {logs.length === 0 && (
                      <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400">No audit log entries found</td></tr>
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
