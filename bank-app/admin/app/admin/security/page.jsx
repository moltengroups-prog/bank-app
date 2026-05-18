'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import Link from 'next/link';
import AdminTopbar from '../../../components/AdminTopbar.jsx';
import AdminBadge from '../../../components/AdminBadge.jsx';
import AdminModal from '../../../components/AdminModal.jsx';
import { fraudService, wireService } from '../../../services/adminService.js';
import { connectAdminSocket } from '../../../services/socket/socket.js';
import { onSecurityAlert } from '../../../services/socket/adminSocket.js';

const fmtUSD  = (n) => n == null ? '—' : '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (d) => d ? new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

function RiskBadge({ score }) {
  const level = score >= 80 ? 'CRITICAL' : score >= 60 ? 'HIGH' : score >= 30 ? 'MEDIUM' : 'LOW';
  const styles = {
    CRITICAL: 'bg-red-100 text-red-800 border-red-300',
    HIGH:     'bg-orange-100 text-orange-800 border-orange-300',
    MEDIUM:   'bg-yellow-100 text-yellow-800 border-yellow-300',
    LOW:      'bg-slate-100 text-slate-600 border-slate-300',
  };
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded border ${styles[level]}`}>
      <span>{score}</span>
      <span className="text-[10px] font-medium opacity-75">{level}</span>
    </span>
  );
}

function FraudStatusBadge({ status }) {
  const map = {
    'pending-review': 'bg-amber-50 text-amber-800 border-amber-300',
    'blocked':        'bg-red-50 text-red-800 border-red-300',
    'approved':       'bg-green-50 text-green-800 border-green-300',
    'rejected':       'bg-slate-100 text-slate-600 border-slate-300',
    'monitoring':     'bg-blue-50 text-blue-700 border-blue-300',
    'clean':          'bg-slate-50 text-slate-500 border-slate-200',
  };
  return (
    <span className={`text-[11px] font-medium px-2 py-0.5 rounded border capitalize whitespace-nowrap ${map[status] || map.clean}`}>
      {status}
    </span>
  );
}

function SeverityDot({ severity }) {
  const colors = {
    critical: 'bg-red-500',
    high:     'bg-orange-500',
    medium:   'bg-yellow-400',
    info:     'bg-blue-400',
    warning:  'bg-amber-400',
  };
  return <span className={`w-2 h-2 rounded-full flex-shrink-0 ${colors[severity] || 'bg-slate-400'}`} />;
}

function FlagPill({ flag }) {
  return (
    <span className="inline-block bg-red-50 text-red-700 border border-red-200 text-[10px] font-medium px-1.5 py-0.5 rounded mr-1 mb-1">
      {flag.replace(/_/g, ' ')}
    </span>
  );
}

function StatCard({ label, value, color = 'slate' }) {
  const colors = {
    red:    'text-red-600',
    orange: 'text-orange-600',
    amber:  'text-amber-600',
    green:  'text-green-600',
    blue:   'text-blue-600',
    slate:  'text-slate-700',
  };
  return (
    <div className="bg-white border border-slate-200 rounded-lg p-3 sm:p-4">
      <p className="text-[10px] sm:text-xs text-slate-500 mb-1 leading-tight">{label}</p>
      <p className={`text-xl sm:text-2xl font-bold ${colors[color]}`}>{value ?? '—'}</p>
    </div>
  );
}

function InspectModal({ tx, onClose, onApprove, onReject, onFreeze, actionLoading }) {
  const [rejectReason,    setRejectReason]    = useState('');
  const [showRejectForm,  setShowRejectForm]  = useState(false);
  const [freezeReason,    setFreezeReason]    = useState('');
  const [showFreezeForm,  setShowFreezeForm]  = useState(false);

  if (!tx) return null;

  return (
    <AdminModal
      open={true}
      title={`Fraud Case — ${tx.referenceNumber}`}
      onClose={onClose}
      size="lg"
      footer={
        tx.fraudStatus === 'pending-review' ? (
          <div className="flex items-center gap-2 flex-wrap w-full">
            <button
              onClick={() => onApprove(tx.id)}
              disabled={actionLoading}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              {actionLoading === 'approve' ? 'Approving…' : 'Approve Transfer'}
            </button>
            <button
              onClick={() => setShowRejectForm(true)}
              disabled={actionLoading}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              Reject
            </button>
            <button
              onClick={() => setShowFreezeForm(true)}
              disabled={actionLoading}
              className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 disabled:opacity-50 text-xs font-semibold rounded-lg transition-colors"
            >
              Freeze Account
            </button>
          </div>
        ) : (
          <p className="text-xs text-slate-400">
            Reviewed {fmtDate(tx.reviewedAt)}
            {tx.reviewedBy ? ` by ${tx.reviewedBy.firstName} ${tx.reviewedBy.lastName}` : ''}
          </p>
        )
      }
    >
      <div className="space-y-4">
        {/* Transfer summary */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Amount</p>
            <p className="text-2xl font-bold text-slate-900">{fmtUSD(tx.amount)}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Risk Score</p>
            <RiskBadge score={tx.riskScore} />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Status</p>
            <FraudStatusBadge status={tx.fraudStatus} />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Date</p>
            <p className="text-xs text-slate-700">{fmtDate(tx.transactionDate)}</p>
          </div>
        </div>

        {/* User */}
        <div className="bg-slate-50 rounded-lg p-3">
          <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">Customer</p>
          <p className="text-sm font-medium text-slate-900">
            {tx.user ? `${tx.user.firstName} ${tx.user.lastName}` : '—'}
          </p>
          <p className="text-xs text-slate-500 break-all">{tx.user?.email}</p>
          {tx.user?.id && (
            <Link href={`/admin/users/${tx.user.id}`} className="text-xs text-blue-600 hover:underline mt-1 inline-block">
              View profile →
            </Link>
          )}
        </div>

        {/* Account */}
        <div className="bg-slate-50 rounded-lg p-3">
          <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">Account</p>
          <p className="text-xs text-slate-700">{tx.account?.accountName} ••••{tx.account?.last4}</p>
          <p className="text-xs text-slate-500 mt-0.5">{tx.description}</p>
        </div>

        {/* Triggered rules */}
        {tx.fraudFlags?.length > 0 && (
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-2">Triggered Rules</p>
            <div>
              {tx.fraudFlags.map((f) => <FlagPill key={f} flag={f} />)}
            </div>
          </div>
        )}

        {tx.blockedReason && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <p className="text-[10px] text-red-600 uppercase tracking-wide mb-0.5">Block Reason</p>
            <p className="text-xs text-red-800">{tx.blockedReason}</p>
          </div>
        )}

        {/* Reject form */}
        {showRejectForm && (
          <div className="border-t border-slate-200 pt-4">
            <p className="text-xs font-medium text-slate-700 mb-2">Rejection reason</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={2}
              placeholder="Reason for rejection…"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs resize-none focus:outline-none focus:border-red-400"
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => onReject(tx.id, rejectReason)}
                disabled={actionLoading}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-semibold rounded transition-colors"
              >
                {actionLoading === 'reject' ? 'Rejecting…' : 'Confirm Reject'}
              </button>
              <button onClick={() => setShowRejectForm(false)} className="px-3 py-1.5 text-slate-500 text-xs hover:underline">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Freeze form */}
        {showFreezeForm && (
          <div className="border-t border-slate-200 pt-4">
            <p className="text-xs font-medium text-slate-700 mb-2">Freeze reason</p>
            <textarea
              value={freezeReason}
              onChange={(e) => setFreezeReason(e.target.value)}
              rows={2}
              placeholder="Reason for freezing account…"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs resize-none focus:outline-none focus:border-orange-400"
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => onFreeze(tx.id, freezeReason)}
                disabled={actionLoading}
                className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white text-xs font-semibold rounded transition-colors"
              >
                {actionLoading === 'freeze' ? 'Freezing…' : 'Freeze + Reject'}
              </button>
              <button onClick={() => setShowFreezeForm(false)} className="px-3 py-1.5 text-slate-500 text-xs hover:underline">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminModal>
  );
}

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

function WireInspectModal({ wire, onClose, onApprove, onReject, actionLoading }) {
  const [rejectReason,   setRejectReason]   = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [approveNotes,   setApproveNotes]   = useState('');
  const [showApproveForm,setShowApproveForm]= useState(false);

  if (!wire) return null;

  const recipient = wire.recipient;
  const rName     = [recipient?.firstName, recipient?.lastName, recipient?.businessName].filter(Boolean).join(' ') || '—';

  return (
    <AdminModal
      open={true}
      title={`Wire Transfer — ${wire.referenceNumber}`}
      onClose={onClose}
      size="lg"
      footer={
        wire.status === 'pending-review' ? (
          <div className="flex items-center gap-2 flex-wrap w-full">
            <button
              onClick={() => setShowApproveForm((v) => !v)}
              disabled={actionLoading}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              Approve
            </button>
            <button
              onClick={() => setShowRejectForm((v) => !v)}
              disabled={actionLoading}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              Reject
            </button>
          </div>
        ) : (
          <p className="text-xs text-slate-400">
            Reviewed {fmtDate(wire.reviewedAt)}
          </p>
        )
      }
    >
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Amount</p>
            <p className="text-2xl font-bold text-slate-900">{fmtUSD(wire.amount)}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Risk Score</p>
            <RiskBadge score={wire.riskScore} />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Status</p>
            <WireStatusBadge status={wire.status} />
          </div>
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Submitted</p>
            <p className="text-xs text-slate-700">{fmtDate(wire.submittedAt)}</p>
          </div>
        </div>

        <div className="bg-slate-50 rounded-lg p-3">
          <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">Customer</p>
          <p className="text-sm font-medium text-slate-900">
            {wire.user ? `${wire.user.firstName} ${wire.user.lastName}` : '—'}
          </p>
          <p className="text-xs text-slate-500 break-all">{wire.user?.email}</p>
        </div>

        <div className="bg-slate-50 rounded-lg p-3">
          <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">Source Account</p>
          <p className="text-xs text-slate-700">
            {wire.fromAccount?.accountName} ••••{wire.fromAccount?.last4}
          </p>
        </div>

        <div className="bg-slate-50 rounded-lg p-3">
          <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-2">Recipient</p>
          <p className="text-sm font-medium text-slate-900">{rName}</p>
          {recipient?.bankName && <p className="text-xs text-slate-500 mt-0.5">{recipient.bankName}</p>}
          {recipient?.accountNumberMasked && (
            <p className="text-xs text-slate-500">{recipient.accountNumberMasked}</p>
          )}
          {recipient?.routingNumber && (
            <p className="text-xs text-slate-500">Routing: {recipient.routingNumber}</p>
          )}
          {recipient?.country && (
            <p className="text-xs text-slate-500 mt-0.5">Country: {recipient.country}</p>
          )}
        </div>

        {wire.memo && (
          <div className="bg-slate-50 rounded-lg px-3 py-2">
            <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-0.5">Memo</p>
            <p className="text-xs text-slate-700">{wire.memo}</p>
          </div>
        )}

        {wire.fraudFlags?.length > 0 && (
          <div>
            <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-2">Fraud Flags</p>
            <div>{wire.fraudFlags.map((f) => <FlagPill key={f} flag={f} />)}</div>
          </div>
        )}

        {wire.blockedReason && (
          <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <p className="text-[10px] text-red-600 uppercase tracking-wide mb-0.5">Block Reason</p>
            <p className="text-xs text-red-800">{wire.blockedReason}</p>
          </div>
        )}

        {showApproveForm && (
          <div className="border-t border-slate-200 pt-4">
            <p className="text-xs font-medium text-slate-700 mb-2">Review notes (optional)</p>
            <textarea
              value={approveNotes}
              onChange={(e) => setApproveNotes(e.target.value)}
              rows={2}
              placeholder="Notes for the approval…"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs resize-none focus:outline-none focus:border-green-400"
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => onApprove(wire._id, approveNotes)}
                disabled={actionLoading}
                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-xs font-semibold rounded transition-colors"
              >
                {actionLoading === 'approve' ? 'Approving…' : 'Confirm Approve'}
              </button>
              <button onClick={() => setShowApproveForm(false)} className="px-3 py-1.5 text-slate-500 text-xs hover:underline">
                Cancel
              </button>
            </div>
          </div>
        )}

        {showRejectForm && (
          <div className="border-t border-slate-200 pt-4">
            <p className="text-xs font-medium text-slate-700 mb-2">Rejection reason</p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={2}
              placeholder="Reason for rejection…"
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs resize-none focus:outline-none focus:border-red-400"
            />
            <div className="flex gap-2 mt-2">
              <button
                onClick={() => onReject(wire._id, rejectReason)}
                disabled={actionLoading}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-semibold rounded transition-colors"
              >
                {actionLoading === 'reject' ? 'Rejecting…' : 'Confirm Reject'}
              </button>
              <button onClick={() => setShowRejectForm(false)} className="px-3 py-1.5 text-slate-500 text-xs hover:underline">
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </AdminModal>
  );
}

export default function SecurityPage() {
  const [stats,              setStats]              = useState(null);
  const [pending,            setPending]            = useState([]);
  const [history,            setHistory]            = useState([]);
  const [pendingWires,       setPendingWires]       = useState([]);
  const [loading,            setLoading]            = useState(true);
  const [activeTab,          setActiveTab]          = useState('pending');
  const [inspecting,         setInspecting]         = useState(null);
  const [inspectingWire,     setInspectingWire]     = useState(null);
  const [actionLoading,      setActionLoading]      = useState(null);
  const [wireActionLoading,  setWireActionLoading]  = useState(null);
  const [alertFeed,          setAlertFeed]          = useState([]);
  const [showAlerts,         setShowAlerts]         = useState(false);
  const alertFeedRef                                = useRef([]);

  const loadData = useCallback(async () => {
    try {
      const [statsRes, pendingRes, historyRes, pendingWiresRes] = await Promise.allSettled([
        fraudService.getStats(),
        fraudService.getPending(),
        fraudService.getHistory({ limit: 30 }),
        wireService.getPending(),
      ]);
      if (statsRes.status        === 'fulfilled') setStats(statsRes.value?.data);
      if (pendingRes.status      === 'fulfilled') setPending(pendingRes.value?.data || []);
      if (historyRes.status      === 'fulfilled') setHistory(historyRes.value?.data || []);
      if (pendingWiresRes.status === 'fulfilled') setPendingWires(pendingWiresRes.value?.data || []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    let cleanup;
    connectAdminSocket().then(() => {
      cleanup = onSecurityAlert((alert) => {
        const entry = { ...alert, id: `${Date.now()}-${Math.random()}`, receivedAt: new Date() };
        alertFeedRef.current = [entry, ...alertFeedRef.current].slice(0, 50);
        setAlertFeed([...alertFeedRef.current]);
        if (['BLOCKED_TRANSFER', 'PENDING_REVIEW', 'FRAUD_APPROVED', 'FRAUD_REJECTED', 'ACCOUNT_FROZEN'].includes(alert.type)) {
          loadData();
        }
      });
    });
    return () => cleanup?.();
  }, [loadData]);

  const handleApprove = useCallback(async (id) => {
    setActionLoading('approve');
    try { await fraudService.approve(id); setInspecting(null); loadData(); }
    finally { setActionLoading(null); }
  }, [loadData]);

  const handleReject = useCallback(async (id, reason) => {
    setActionLoading('reject');
    try { await fraudService.reject(id, reason || 'Rejected by fraud review team'); setInspecting(null); loadData(); }
    finally { setActionLoading(null); }
  }, [loadData]);

  const handleFreeze = useCallback(async (id, reason) => {
    setActionLoading('freeze');
    try { await fraudService.freezeAccount(id, reason || 'Frozen due to suspicious activity'); setInspecting(null); loadData(); }
    finally { setActionLoading(null); }
  }, [loadData]);

  const handleWireApprove = useCallback(async (id, notes) => {
    setWireActionLoading('approve');
    try { await wireService.approve(id, notes); setInspectingWire(null); loadData(); }
    finally { setWireActionLoading(null); }
  }, [loadData]);

  const handleWireReject = useCallback(async (id, reason) => {
    setWireActionLoading('reject');
    try { await wireService.reject(id, reason || 'Rejected by security review team'); setInspectingWire(null); loadData(); }
    finally { setWireActionLoading(null); }
  }, [loadData]);

  const tableData = activeTab === 'pending' ? pending : history;

  return (
    <div className="flex-1 overflow-y-auto">
      <AdminTopbar
        title="Fraud & Risk Center"
        subtitle="Real-time fraud monitoring and review queue"
        actions={
          /* Mobile toggle for alert feed */
          <button
            onClick={() => setShowAlerts((v) => !v)}
            className="lg:hidden relative text-xs px-3 py-1.5 border border-slate-200 rounded text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Alerts
            {alertFeed.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] rounded-full flex items-center justify-center font-bold">
                {alertFeed.length > 9 ? '9+' : alertFeed.length}
              </span>
            )}
          </button>
        }
      />

      <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
        {loading ? (
          <div className="text-center py-12 text-sm text-slate-400">Loading fraud data…</div>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <StatCard label="Pending Review"  value={stats?.pending}        color="amber" />
              <StatCard label="Blocked Today"   value={stats?.blockedToday}   color="red"   />
              <StatCard label="Approved Today"  value={stats?.approvedToday}  color="green" />
              <StatCard label="Rejected Today"  value={stats?.rejectedToday}  color="slate" />
              <StatCard label="Frozen Accounts" value={stats?.frozenAccounts} color="orange" />
            </div>

            {/* Mobile alert feed (collapsible) */}
            {showAlerts && (
              <div className="lg:hidden bg-white border border-slate-200 rounded-lg overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <h2 className="text-xs font-semibold text-slate-700">Live Alerts</h2>
                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-[10px] text-green-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      Live
                    </span>
                    <button onClick={() => setShowAlerts(false)} className="text-slate-400 hover:text-slate-600 text-xs">
                      ✕
                    </button>
                  </div>
                </div>
                <div className="divide-y divide-slate-50 max-h-[300px] overflow-y-auto">
                  {alertFeed.length === 0 ? (
                    <div className="p-4 text-center text-[11px] text-slate-400">Waiting for security events…</div>
                  ) : alertFeed.map((alert) => (
                    <div key={alert.id} className="px-3 py-2.5">
                      <div className="flex items-start gap-2">
                        <SeverityDot severity={alert.severity} />
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-semibold text-slate-800">{alert.type?.replace(/_/g, ' ')}</p>
                          {alert.userName && <p className="text-[10px] text-slate-500 truncate">{alert.userName}</p>}
                          {alert.amount && <p className="text-[10px] font-medium text-slate-700">{fmtUSD(alert.amount)}</p>}
                          <p className="text-[10px] text-slate-400 mt-0.5">{alert.receivedAt ? fmtDate(alert.receivedAt) : ''}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Main section: fraud table + live alert feed (desktop) */}
            <div className="flex flex-col lg:flex-row gap-4 sm:gap-5">
              {/* Fraud table */}
              <div className="flex-1 bg-white border border-slate-200 rounded-lg overflow-hidden min-w-0">
                {/* Tabs */}
                <div className="flex items-center border-b border-slate-200 px-4">
                  {[
                    { key: 'pending', label: 'Pending Review', count: pending.length },
                    { key: 'history', label: 'History',        count: null },
                  ].map((t) => (
                    <button
                      key={t.key}
                      onClick={() => setActiveTab(t.key)}
                      className={`px-3 sm:px-4 py-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-2 -mb-px ${
                        activeTab === t.key
                          ? 'border-blue-500 text-blue-700'
                          : 'border-transparent text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {t.label}
                      {t.count != null && t.count > 0 && (
                        <span className="bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                          {t.count}
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Table */}
                {tableData.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400">
                    {activeTab === 'pending' ? 'No transfers pending review' : 'No fraud history'}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs min-w-[480px]">
                      <thead>
                        <tr className="border-b border-slate-100 bg-slate-50">
                          <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wide">User</th>
                          <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Amount</th>
                          <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Risk</th>
                          <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                          <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wide hidden md:table-cell">Flags</th>
                          <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Date</th>
                          <th className="px-4 py-2.5" />
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {tableData.map((tx) => (
                          <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-3">
                              <p className="font-medium text-slate-900 truncate max-w-[100px] sm:max-w-[130px]">
                                {tx.user ? `${tx.user.firstName} ${tx.user.lastName}` : '—'}
                              </p>
                              <p className="text-[10px] text-slate-400 truncate max-w-[100px] sm:max-w-[130px]">{tx.user?.email}</p>
                            </td>
                            <td className="px-4 py-3">
                              <p className="font-bold text-slate-900 whitespace-nowrap">{fmtUSD(tx.amount)}</p>
                              <p className="text-[10px] text-slate-400 hidden sm:block">{tx.referenceNumber}</p>
                            </td>
                            <td className="px-4 py-3">
                              <RiskBadge score={tx.riskScore} />
                            </td>
                            <td className="px-4 py-3">
                              <FraudStatusBadge status={tx.fraudStatus} />
                            </td>
                            <td className="px-4 py-3 max-w-[160px] hidden md:table-cell">
                              {tx.fraudFlags?.slice(0, 2).map((f) => <FlagPill key={f} flag={f} />)}
                              {tx.fraudFlags?.length > 2 && (
                                <span className="text-[10px] text-slate-400">+{tx.fraudFlags.length - 2} more</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-slate-500 whitespace-nowrap hidden sm:table-cell">{fmtDate(tx.transactionDate)}</td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => setInspecting(tx)}
                                className="text-xs text-blue-600 hover:underline font-medium whitespace-nowrap"
                              >
                                Inspect →
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Live alert feed — desktop sidebar */}
              <div className="hidden lg:flex w-72 flex-shrink-0 bg-white border border-slate-200 rounded-lg overflow-hidden flex-col">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
                  <h2 className="text-xs font-semibold text-slate-700">Live Alerts</h2>
                  <span className="flex items-center gap-1 text-[10px] text-green-600">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    Live
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto divide-y divide-slate-50 max-h-[600px]">
                  {alertFeed.length === 0 ? (
                    <div className="p-4 text-center text-[11px] text-slate-400">
                      Waiting for security events…
                    </div>
                  ) : (
                    alertFeed.map((alert) => (
                      <div key={alert.id} className="px-3 py-2.5">
                        <div className="flex items-start gap-2">
                          <SeverityDot severity={alert.severity} />
                          <div className="flex-1 min-w-0">
                            <p className="text-[11px] font-semibold text-slate-800">
                              {alert.type?.replace(/_/g, ' ')}
                            </p>
                            {alert.userName && (
                              <p className="text-[10px] text-slate-500 truncate">{alert.userName}</p>
                            )}
                            {alert.amount && (
                              <p className="text-[10px] font-medium text-slate-700">{fmtUSD(alert.amount)}</p>
                            )}
                            {alert.riskScore != null && (
                              <RiskBadge score={alert.riskScore} />
                            )}
                            <p className="text-[10px] text-slate-400 mt-0.5">
                              {alert.receivedAt ? fmtDate(alert.receivedAt) : ''}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* ── Pending Wire Queue ── */}
            {pendingWires.length > 0 && (
              <div className="bg-white border border-amber-200 rounded-lg overflow-hidden">
                <div className="px-4 py-3 border-b border-amber-100 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse flex-shrink-0" />
                  <h2 className="text-sm font-semibold text-slate-800">Pending Wire Transfers</h2>
                  <span className="ml-auto bg-amber-100 text-amber-800 border border-amber-300 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                    {pendingWires.length}
                  </span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs min-w-[540px]">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50">
                        <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Customer</th>
                        <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Amount</th>
                        <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Recipient</th>
                        <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wide">Risk</th>
                        <th className="text-left px-4 py-2.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wide hidden sm:table-cell">Submitted</th>
                        <th className="px-4 py-2.5" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {pendingWires.map((w) => {
                        const rName = [w.recipient?.firstName, w.recipient?.lastName, w.recipient?.businessName].filter(Boolean).join(' ') || '—';
                        return (
                          <tr key={w._id} className="hover:bg-amber-50 transition-colors">
                            <td className="px-4 py-3">
                              <p className="font-medium text-slate-900 truncate max-w-[120px]">
                                {w.user ? `${w.user.firstName} ${w.user.lastName}` : '—'}
                              </p>
                              <p className="text-[10px] text-slate-400 truncate max-w-[120px]">{w.user?.email}</p>
                            </td>
                            <td className="px-4 py-3">
                              <p className="font-bold text-slate-900 whitespace-nowrap">{fmtUSD(w.amount)}</p>
                              <p className="text-[10px] text-slate-400">{w.referenceNumber}</p>
                            </td>
                            <td className="px-4 py-3">
                              <p className="text-slate-800 truncate max-w-[130px]">{rName}</p>
                              <p className="text-[10px] text-slate-400">{w.recipient?.country}</p>
                            </td>
                            <td className="px-4 py-3"><RiskBadge score={w.riskScore} /></td>
                            <td className="px-4 py-3 text-slate-500 whitespace-nowrap hidden sm:table-cell">{fmtDate(w.submittedAt)}</td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => setInspectingWire(w)}
                                className="text-xs text-blue-600 hover:underline font-medium whitespace-nowrap"
                              >
                                Review →
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {inspecting && (
        <InspectModal
          tx={inspecting}
          onClose={() => setInspecting(null)}
          onApprove={handleApprove}
          onReject={handleReject}
          onFreeze={handleFreeze}
          actionLoading={actionLoading}
        />
      )}

      {inspectingWire && (
        <WireInspectModal
          wire={inspectingWire}
          onClose={() => setInspectingWire(null)}
          onApprove={handleWireApprove}
          onReject={handleWireReject}
          actionLoading={wireActionLoading}
        />
      )}
    </div>
  );
}
