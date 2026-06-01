import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import { api } from '../services/api';
import { getSocket } from '../socket/socket';

const SEVERITY_STYLES = {
  low:      { banner: 'bg-blue-50 border-blue-200',   badge: 'bg-blue-100 text-blue-700',   label: 'Low'      },
  medium:   { banner: 'bg-amber-50 border-amber-200', badge: 'bg-amber-100 text-amber-700', label: 'Medium'   },
  high:     { banner: 'bg-orange-50 border-orange-200', badge: 'bg-orange-100 text-orange-700', label: 'High' },
  critical: { banner: 'bg-red-50 border-red-300',     badge: 'bg-red-100 text-red-700',     label: 'Critical' },
};

const RESTRICTION_LABELS = {
  login:                     'Login access',
  transfers:                 'Account transfers',
  wires:                     'Wire transfers',
  billPay:                   'Bill payments',
  zelle:                     'Zelle transfers',
  debitCard:                 'Debit card transactions',
  creditCard:                'Credit card transactions',
  internationalTransactions: 'International transactions',
  otpRequired:               'Additional OTP required',
  identityVerification:      'Identity verification required',
  freezeAccount:             'Account frozen',
};

function fmtDate(d) {
  return new Date(d).toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric',
  });
}

function Row({ label, value }) {
  return (
    <div className="flex items-start justify-between px-5 py-4">
      <span className="text-[14px] text-gray-500 flex-shrink-0 mr-4">{label}</span>
      <span className="text-[14px] text-gray-900 font-medium text-right max-w-[58%] leading-snug">{value}</span>
    </div>
  );
}

export default function SecurityAlertPage() {
  const navigate  = useNavigate();
  const { state } = useLocation();
  const alertId   = state?.alertId;

  const [alert,   setAlert]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    if (!alertId) {
      // No specific alert — fetch the most severe active one
      api.get('/security-alerts/active')
        .then((res) => {
          const list = res?.data || [];
          if (list.length > 0) setAlert(list[0]);
          else setError('No active security alerts found.');
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    } else {
      api.get(`/security-alerts/${alertId}`)
        .then((res) => setAlert(res?.data))
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [alertId]);

  // Live dismiss when admin resolves
  useEffect(() => {
    const s = getSocket();
    if (!s) return;
    const onRemoved = ({ alertId: removedId }) => {
      if (alert && String(alert._id) === String(removedId)) {
        setAlert((prev) => prev ? { ...prev, status: 'resolved' } : prev);
      }
    };
    s.on('security:alert:removed', onRemoved);
    return () => s.off('security:alert:removed', onRemoved);
  }, [alert]);

  const style = alert ? (SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.medium) : null;

  // Active restrictions list
  const activeRestrictions = alert
    ? Object.entries(alert.restrictions || {}).filter(([, v]) => v).map(([k]) => RESTRICTION_LABELS[k] || k)
    : [];

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 font-sans">
      <AppHeader showBackButton title="Security Alert" showSpacer />

      <div className="flex-1 pt-[64px] pb-10 overflow-y-auto">

        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-4 border-[#002D72] border-t-transparent rounded-full animate-spin" />
          </div>

        ) : error ? (
          <div className="mx-4 mt-6 bg-red-50 border border-red-200 rounded-xl px-5 py-4">
            <p className="text-red-600 text-sm">{error}</p>
          </div>

        ) : !alert ? null : (
          <>
            {/* ── Severity banner ── */}
            <div className={`${style.banner} border-b-2 px-5 py-5 flex items-start gap-4`}>
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center flex-shrink-0 shadow-sm">
                <svg className={`w-5 h-5 ${alert.severity === 'low' ? 'text-blue-600' : alert.severity === 'medium' ? 'text-amber-600' : alert.severity === 'high' ? 'text-orange-600' : 'text-red-600'}`}
                  viewBox="0 0 24 24" fill="currentColor">
                  <path fillRule="evenodd"
                    d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z"
                    clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-bold text-gray-900 text-[17px]">{alert.title}</p>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${style.badge}`}>
                    {style.label}
                  </span>
                </div>
                <p className="text-[14px] text-gray-600 leading-relaxed">{alert.message}</p>
              </div>
            </div>

            {/* ── Alert details ── */}
            <div className="mx-4 mt-4 bg-white rounded-2xl shadow-sm overflow-hidden">
              <p className="px-5 pt-4 pb-2 text-[11px] text-gray-400 font-semibold uppercase tracking-widest">
                Alert Details
              </p>
              <div className="divide-y divide-gray-100">
                <Row label="Status"
                  value={
                    <span className={`px-2 py-0.5 rounded-full text-[12px] font-bold ${
                      alert.status === 'resolved'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}>
                      {alert.status === 'resolved' ? 'Resolved' : 'Active'}
                    </span>
                  }
                />
                <Row label="Severity"   value={style.label} />
                <Row label="Date Issued" value={fmtDate(alert.createdAt)} />
                {alert.resolvedAt && (
                  <Row label="Resolved On" value={fmtDate(alert.resolvedAt)} />
                )}
              </div>
            </div>

            {/* ── Account restrictions ── */}
            {activeRestrictions.length > 0 && (
              <div className="mx-4 mt-4 bg-white rounded-2xl shadow-sm overflow-hidden">
                <p className="px-5 pt-4 pb-2 text-[11px] text-gray-400 font-semibold uppercase tracking-widest">
                  Account Restrictions
                </p>
                <div className="px-5 pb-4">
                  {activeRestrictions.map((r, i) => (
                    <div key={i} className="flex items-center gap-2.5 py-2 border-b border-gray-100 last:border-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />
                      <p className="text-[14px] text-gray-700">{r}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Resolution ── */}
            {alert.status === 'resolved' && alert.resolutionNotes && (
              <div className="mx-4 mt-4 bg-green-50 border border-green-200 rounded-2xl px-5 py-4">
                <p className="text-[13px] font-bold text-green-800 mb-1">Resolution Notes</p>
                <p className="text-[13px] text-green-700 leading-relaxed">{alert.resolutionNotes}</p>
              </div>
            )}

            {/* ── Resolution instructions ── */}
            {alert.status !== 'resolved' && (
              <div className="mx-4 mt-4 bg-white rounded-2xl shadow-sm overflow-hidden">
                <p className="px-5 pt-4 pb-2 text-[11px] text-gray-400 font-semibold uppercase tracking-widest">
                  How to Resolve
                </p>
                <div className="px-5 pb-5">
                  <p className="text-[14px] text-gray-700 leading-relaxed">
                    To resolve this security concern, please contact our support team.
                    A representative will verify your identity and guide you through
                    restoring full account access.
                  </p>
                </div>
              </div>
            )}

            {/* ── Chat with support ── */}
            {alert.status !== 'resolved' && alert.requiresChatResolution && (
              <div className="mx-4 mt-6">
                <button
                  type="button"
                  onClick={() => navigate('/live-chat', {
                    state: {
                      context: 'security_alert',
                      alertId: String(alert._id),
                      alertTitle: alert.title,
                      severity: alert.severity,
                      createdAt: alert.createdAt,
                    },
                  })}
                  className="w-full py-4 bg-[#002D72] text-white font-bold text-sm tracking-widest rounded-full"
                >
                  CHAT WITH SUPPORT
                </button>
                <p className="text-center text-[12px] text-gray-400 mt-3 leading-snug">
                  A support agent will contact you to verify your identity and resolve this alert.
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
