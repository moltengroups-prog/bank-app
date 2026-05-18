import React, { useState, useEffect } from 'react';
import LegalDisclosure from '../components/LegalDisclosure';
import InsetDivider from '../components/InsetDivider';
import AppHeader from '../components/AppHeader';
import EricaSearchBar from '../components/EricaSearchBar';
import { useNotificationStore } from '../store/notificationStore';

/* ─── Relative timestamp ────────────────────────────────────────── */
function formatRelative(dateStr) {
  const now  = new Date();
  const d    = new Date(dateStr);
  const mins = Math.floor((now - d) / 60000);
  if (mins < 1)   return 'Just now';
  if (mins < 60)  return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs}h ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/* ─── Type icon + color config ──────────────────────────────────── */
const TYPE_CONFIG = {
  success:  { dotColor: 'bg-green-500',   iconColor: 'text-green-600'  },
  security: { dotColor: 'bg-[#1a6bbf]',   iconColor: 'text-[#1a6bbf]' },
  warning:  { dotColor: 'bg-amber-500',   iconColor: 'text-amber-600'  },
  info:     { dotColor: 'bg-[#1a6bbf]',   iconColor: 'text-[#1a6bbf]' },
  error:    { dotColor: 'bg-red-500',     iconColor: 'text-red-600'    },
};

const IconTypeSuccess = () => (
  <svg className="w-5 h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const IconTypeSecurity = () => (
  <svg className="w-5 h-5 text-[#1a6bbf] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);
const IconTypeWarning = () => (
  <svg className="w-5 h-5 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);
const IconTypeInfo = () => (
  <svg className="w-5 h-5 text-[#1a6bbf] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" strokeWidth={1.5} />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 16v-4M12 8h.01" />
  </svg>
);
const IconTypeError = () => (
  <svg className="w-5 h-5 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

function TypeIcon({ type }) {
  switch (type) {
    case 'success':  return <IconTypeSuccess />;
    case 'security': return <IconTypeSecurity />;
    case 'warning':  return <IconTypeWarning />;
    case 'error':    return <IconTypeError />;
    default:         return <IconTypeInfo />;
  }
}

const IconChevronDown = () => (
  <svg className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);
const IconChevronUp = () => (
  <svg className="w-5 h-5 text-gray-400 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
  </svg>
);

function CommunicationsPage() {
  const [alertsOpen, setAlertsOpen] = useState(true);

  const {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markRead,
    markAllRead,
  } = useNotificationStore();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 font-sans">

      <AppHeader showBackButton title="Communications" showSpacer />

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto pt-[64px] pb-8">

        <EricaSearchBar showProviderText />

        <div className="bg-white mt-6">

          {/* ── Status Tracker (static) ── */}
          <button
            type="button"
            className="w-full flex items-start justify-between px-5 py-6 text-left active:bg-gray-50"
          >
            <div className="flex items-start gap-3 flex-1 pr-4">
              <div className="w-3 h-3 rounded-full bg-[#1a6bbf] mt-1.5 flex-shrink-0" />
              <div>
                <p className="text-xl font-bold text-gray-900">Status Tracker</p>
                <p className="text-sm text-gray-500 mt-1 leading-snug">
                  For service items, claims and requests
                </p>
              </div>
            </div>
            <IconChevronDown />
          </button>

          <InsetDivider color={200} />

          {/* ── Alerts (live notifications) ── */}
          <button
            type="button"
            onClick={() => setAlertsOpen((v) => !v)}
            className="w-full flex items-start justify-between px-5 py-6 text-left active:bg-gray-50"
          >
            <div className="flex items-start gap-3 flex-1 pr-4">
              {unreadCount > 0 && (
                <div className="w-3 h-3 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
              )}
              <div>
                <p className="text-xl font-bold text-gray-900">
                  Alerts
                  {unreadCount > 0 && (
                    <span className="ml-2 text-sm font-semibold text-[#1a6bbf]">
                      {unreadCount} new
                    </span>
                  )}
                </p>
                <p className="text-sm text-gray-500 mt-1 leading-snug">
                  Your notifications from Bank of Molten
                </p>
              </div>
            </div>
            {alertsOpen ? <IconChevronUp /> : <IconChevronDown />}
          </button>

          {/* ── Notifications list ── */}
          {alertsOpen && (
            <>
              <InsetDivider color={200} />

              {/* Mark all read */}
              {unreadCount > 0 && (
                <div className="flex justify-end px-5 py-2">
                  <button
                    type="button"
                    onClick={markAllRead}
                    className="text-xs font-semibold text-[#1a6bbf] active:opacity-70"
                  >
                    Mark all as read
                  </button>
                </div>
              )}

              {/* Loading skeletons */}
              {loading && (
                <div className="px-5 py-4 space-y-4">
                  {[1, 2, 3].map((n) => (
                    <div key={n} className="flex gap-3 animate-pulse">
                      <div className="w-5 h-5 bg-gray-100 rounded-full flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <div className="h-3 bg-gray-100 rounded w-40 mb-2" />
                        <div className="h-2.5 bg-gray-100 rounded w-56" />
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Error state */}
              {!loading && error && (
                <p className="px-5 py-4 text-red-400 text-sm text-center">{error}</p>
              )}

              {/* Empty state */}
              {!loading && !error && notifications.length === 0 && (
                <div className="px-5 py-8 text-center">
                  <p className="text-gray-400 text-sm">You have no notifications.</p>
                </div>
              )}

              {/* Notification rows */}
              {!loading && !error && notifications.map((notif, i) => {
                const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.info;
                return (
                  <React.Fragment key={notif.id}>
                    <button
                      type="button"
                      onClick={() => !notif.isRead && markRead(notif.id)}
                      className={`w-full flex items-start gap-3 px-5 py-4 text-left active:bg-gray-50 transition-colors ${
                        notif.isRead ? '' : 'bg-blue-50/40'
                      }`}
                    >
                      {/* Unread dot */}
                      <div className="flex-shrink-0 mt-1.5 w-2">
                        {!notif.isRead && (
                          <div className={`w-2 h-2 rounded-full ${cfg.dotColor}`} />
                        )}
                      </div>

                      {/* Type icon */}
                      <TypeIcon type={notif.type} />

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm leading-snug ${notif.isRead ? 'font-medium text-gray-700' : 'font-bold text-gray-900'}`}>
                            {notif.title}
                          </p>
                          <p className="text-xs text-gray-400 flex-shrink-0 mt-0.5">
                            {formatRelative(notif.createdAt)}
                          </p>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 leading-snug">
                          {notif.message}
                        </p>
                      </div>
                    </button>
                    {i < notifications.length - 1 && <InsetDivider color={100} />}
                  </React.Fragment>
                );
              })}
            </>
          )}

        </div>

        <InsetDivider className="mt-8" />

        <LegalDisclosure />
      </div>

    </div>
  );
}

export default CommunicationsPage;
