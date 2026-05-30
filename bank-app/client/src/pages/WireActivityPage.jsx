import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import InsetDivider from '../components/InsetDivider';
import { api } from '../services/api';
import { getSocket } from '../socket/socket';

const SHORT_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function fmtUSD(n) {
  return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtDate(d) {
  const date = new Date(d);
  return `${SHORT_MONTHS[date.getMonth()]} ${date.getDate()}`;
}

const STATUS_META = {
  processing:      { label: 'Processing',    bg: 'bg-blue-50',   text: 'text-blue-700'  },
  'pending-review':{ label: 'Under Review',  bg: 'bg-amber-50',  text: 'text-amber-700' },
  completed:       { label: 'Completed',     bg: 'bg-green-50',  text: 'text-green-700' },
  rejected:        { label: 'Rejected',      bg: 'bg-red-50',    text: 'text-red-700'   },
  blocked:         { label: 'Blocked',       bg: 'bg-red-50',    text: 'text-red-700'   },
  cancelled:       { label: 'Cancelled',     bg: 'bg-gray-50',   text: 'text-gray-500'  },
  draft:           { label: 'Draft',         bg: 'bg-gray-50',   text: 'text-gray-500'  },
};

function StatusBadge({ status }) {
  const meta = STATUS_META[status] || { label: status, bg: 'bg-gray-50', text: 'text-gray-600' };
  return (
    <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${meta.bg} ${meta.text}`}>
      {meta.label}
    </span>
  );
}

function WireRow({ wire, onClick }) {
  const rName = [
    wire.recipient?.firstName,
    wire.recipient?.lastName,
    wire.recipient?.businessName,
  ].filter(Boolean).join(' ') || wire.recipient?.nickname || 'Recipient';

  return (
    <button
      type="button"
      onClick={() => onClick(wire)}
      className="w-full flex items-center justify-between px-5 py-4 bg-white active:bg-gray-50 text-left"
    >
      {/* Left: avatar + name + date */}
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
          <span className="text-[13px] font-bold text-gray-600">
            {rName.slice(0, 2).toUpperCase()}
          </span>
        </div>
        <div className="min-w-0">
          <p className="text-[14px] font-semibold text-gray-900 truncate">{rName}</p>
          <p className="text-[12px] text-gray-400">{fmtDate(wire.submittedAt || wire.createdAt)}</p>
        </div>
      </div>

      {/* Right: amount + status */}
      <div className="flex flex-col items-end gap-1 flex-shrink-0 ml-2">
        <span className="text-[14px] font-bold text-gray-800">{fmtUSD(wire.amount)}</span>
        <StatusBadge status={wire.status} />
      </div>
    </button>
  );
}

// ── Wire detail modal ─────────────────────────────────────────────

function WireDetailModal({ wire, onClose }) {
  const rName = [
    wire.recipient?.firstName,
    wire.recipient?.lastName,
    wire.recipient?.businessName,
  ].filter(Boolean).join(' ') || wire.recipient?.nickname || 'Recipient';

  const sentDate      = new Date(wire.submittedAt || wire.createdAt);
  const availableDate = new Date(sentDate);
  availableDate.setDate(availableDate.getDate() + 3);

  function Row({ label, value }) {
    return (
      <div className="flex items-start justify-between px-5 py-[14px]">
        <span className="text-[14px] text-gray-500 flex-shrink-0 mr-4">{label}</span>
        <span className="text-[14px] text-gray-900 font-medium text-right max-w-[55%]">{value}</span>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40" onClick={onClose}>
      <div
        className="w-full bg-white rounded-t-2xl pb-8 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle + close */}
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <h2 className="text-[17px] font-bold text-gray-900">Wire Details</h2>
          <button type="button" onClick={onClose} className="text-gray-400 text-2xl leading-none px-2">×</button>
        </div>

        <InsetDivider color={100} />

        <div className="bg-white">
          <Row label="Confirmation #" value={<span className="font-mono text-[13px]">{wire.referenceNumber || '—'}</span>} />
          <InsetDivider color={100} />
          <Row label="Status"         value={<StatusBadge status={wire.status} />} />
          <InsetDivider color={100} />
          <Row label="Recipient"      value={rName} />
          <InsetDivider color={100} />
          <Row label="Date sent"      value={fmtDate(sentDate)} />
          <InsetDivider color={100} />
          <Row label="Est. available" value={fmtDate(availableDate)} />
        </div>

        <p className="px-5 pt-5 pb-2 text-[14px] font-bold text-gray-900">Transfer Cost</p>
        <div className="bg-white border-t border-b border-gray-200">
          <Row label="Transfer amount" value={fmtUSD(wire.amount) + ' USD'} />
          <InsetDivider color={100} />
          <Row label="Transfer fee"    value={'+ ' + fmtUSD(wire.fee || 30) + ' USD'} />
          <InsetDivider color={100} />
          <Row label={<span className="font-bold">Total cost</span>}
               value={<span className="font-bold text-gray-900">{fmtUSD((wire.amount || 0) + (wire.fee || 30))} USD</span>} />
        </div>

        {wire.pendingReview && (
          <div className="mx-5 mt-4 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
            <p className="text-[12px] text-amber-800 leading-relaxed">
              Your wire is under security review. You'll be notified once it's processed.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────

export default function WireActivityPage() {
  const navigate = useNavigate();

  const [wires,   setWires]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');
  const [detail,  setDetail]  = useState(null); // wire being inspected

  const fetchWires = () => {
    api.get('/wire-transfers?limit=50')
      .then((res) => setWires(res?.data || []))
      .catch((err) => setError(err.message || 'Failed to load wire transfers.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchWires(); }, []);

  // Live status updates
  useEffect(() => {
    const s = getSocket();
    if (!s) return;
    s.on('wire:settled', fetchWires);
    return () => s.off('wire:settled', fetchWires);
  }, []);

  // Partition by status group
  const inFlight  = wires.filter(w => ['processing', 'pending-review'].includes(w.status));
  const history   = wires.filter(w => ['completed', 'rejected', 'blocked', 'cancelled'].includes(w.status));

  return (
    <div className="flex flex-col h-screen bg-gray-100 font-sans">

      <AppHeader
        showBackButton
        onBack={() => navigate('/pay-transfer')}
        title="Wire Activity"
        showEricaRight
        ericaRightCount={0}
      />

      <div className="flex-1 pt-[64px] overflow-y-auto pb-6">

        {loading ? (
          <div className="space-y-3 px-4 pt-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-16 bg-white rounded-xl animate-pulse" />
            ))}
          </div>
        ) : error ? (
          <div className="px-4 pt-8 text-center">
            <p className="text-red-500 text-sm mb-4">{error}</p>
            <button
              type="button"
              onClick={() => { setLoading(true); setError(''); fetchWires(); }}
              className="px-6 py-2 bg-[#002D72] text-white text-sm font-bold rounded-full"
            >
              Retry
            </button>
          </div>
        ) : wires.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 px-8 text-center">
            <svg className="w-14 h-14 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            <p className="text-gray-400 text-sm">No wire transfers yet.</p>
            <button
              type="button"
              onClick={() => navigate('/wire-transfer')}
              className="mt-4 px-6 py-2 bg-[#002D72] text-white text-sm font-bold rounded-full"
            >
              Start a Wire
            </button>
          </div>
        ) : (
          <>
            {/* In-flight section */}
            {inFlight.length > 0 && (
              <div className="mb-4">
                <p className="px-4 pt-5 pb-2 text-[13px] font-semibold text-gray-500 uppercase tracking-wide">
                  Processing · {fmtUSD(inFlight.reduce((s, w) => s + w.amount, 0))} total
                </p>
                <div className="bg-white border-t border-b border-gray-200">
                  {inFlight.map((wire, i) => (
                    <React.Fragment key={wire._id}>
                      <WireRow wire={wire} onClick={setDetail} />
                      {i < inFlight.length - 1 && <InsetDivider color={100} />}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}

            {/* History section */}
            {history.length > 0 && (
              <div>
                <p className="px-4 pt-4 pb-2 text-[13px] font-semibold text-gray-500 uppercase tracking-wide">
                  History · Showing last {history.length} transfer{history.length !== 1 ? 's' : ''}
                </p>
                <div className="bg-white border-t border-b border-gray-200">
                  {history.map((wire, i) => (
                    <React.Fragment key={wire._id}>
                      <WireRow wire={wire} onClick={setDetail} />
                      {i < history.length - 1 && <InsetDivider color={100} />}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Wire detail modal */}
      {detail && <WireDetailModal wire={detail} onClose={() => setDetail(null)} />}

    </div>
  );
}
