import React from 'react';
import { useNavigate } from 'react-router-dom';

// Severity → visual style (matches BOA screenshot color scheme)
const SEVERITY_STYLES = {
  low:      { bar: 'bg-blue-500',   bg: 'bg-blue-50',   border: 'border-blue-200',   icon: 'text-blue-600',   btn: 'border-blue-600 text-blue-700' },
  medium:   { bar: 'bg-amber-500',  bg: 'bg-amber-50',  border: 'border-amber-300',  icon: 'text-amber-600',  btn: 'border-amber-600 text-amber-700' },
  high:     { bar: 'bg-orange-500', bg: 'bg-orange-50', border: 'border-orange-300', icon: 'text-orange-600', btn: 'border-orange-600 text-orange-700' },
  critical: { bar: 'bg-red-600',    bg: 'bg-red-50',    border: 'border-red-300',    icon: 'text-red-600',    btn: 'border-red-700 text-red-700' },
};

function WarningIcon({ className }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path fillRule="evenodd"
        d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z"
        clipRule="evenodd" />
    </svg>
  );
}

export default function SecurityAlertBanner({ alerts }) {
  const navigate = useNavigate();

  if (!alerts || alerts.length === 0) return null;

  // Show the most severe alert as the primary banner
  const SEVERITY_ORDER = { critical: 4, high: 3, medium: 2, low: 1 };
  const primary = [...alerts].sort(
    (a, b) => (SEVERITY_ORDER[b.severity] || 0) - (SEVERITY_ORDER[a.severity] || 0)
  )[0];

  const style = SEVERITY_STYLES[primary.severity] || SEVERITY_STYLES.medium;

  return (
    <div className={`${style.bg} border-t-2 border-b-2 ${style.border} mx-0 mb-3`}>
      <div className="px-4 py-4">
        <div className="flex items-start gap-3">
          {/* Warning icon */}
          <WarningIcon className={`w-7 h-7 flex-shrink-0 mt-0.5 ${style.icon}`} />

          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 text-[16px] leading-snug mb-1">
              {primary.title}
            </p>
            <p className="text-gray-600 text-[13px] leading-relaxed mb-3">
              {primary.message}
            </p>

            {/* Multiple alerts note */}
            {alerts.length > 1 && (
              <p className="text-[12px] text-gray-500 mb-3">
                +{alerts.length - 1} additional security notice{alerts.length > 2 ? 's' : ''}
              </p>
            )}

            {/* REVIEW ACTIVITY button — outlined, matching severity */}
            <button
              type="button"
              onClick={() => navigate('/security-alert', { state: { alertId: primary._id } })}
              className={`px-5 py-2 border-2 ${style.btn} font-bold text-[12px] tracking-widest rounded-sm bg-white active:opacity-80`}
            >
              REVIEW ACTIVITY
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
