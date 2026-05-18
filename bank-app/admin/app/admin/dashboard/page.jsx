'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import AdminTopbar from '../../../components/AdminTopbar.jsx';
import AdminStatsCard from '../../../components/AdminStatsCard.jsx';
import AdminBadge from '../../../components/AdminBadge.jsx';
import { useAnalyticsStore } from '../../../store/analyticsStore.js';
import { usersService, transfersService, supportService } from '../../../services/adminService.js';
import { connectAdminSocket } from '../../../services/socket/socket.js';
import { onNewUser, onNewTransfer, onNewSupportConversation } from '../../../services/socket/adminSocket.js';

const fmt    = (n) => n == null ? '—' : Number(n).toLocaleString('en-US');
const fmtUSD = (n) => n == null ? '—' : '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (d) => d ? new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

function SectionHeader({ title, href }) {
  return (
    <div className="flex items-center justify-between mb-3">
      <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wide">{title}</h2>
      {href && <Link href={href} className="text-xs text-blue-600 hover:underline">View all →</Link>}
    </div>
  );
}

export default function DashboardPage() {
  const { overview, fetchOverview } = useAnalyticsStore();
  const [recentUsers,     setRecentUsers]     = useState([]);
  const [recentTransfers, setRecentTransfers] = useState([]);
  const [openChats,       setOpenChats]       = useState([]);
  const [pageLoading,     setPageLoading]     = useState(true);

  useEffect(() => {
    setPageLoading(true);

    const safe = (label, promise, onSuccess) =>
      promise
        .then(onSuccess)
        .catch((err) => console.warn(`[admin] ${label} failed:`, err.message));

    Promise.allSettled([
      safe('analytics/overview',  fetchOverview(),                                          () => {}),
      safe('admin/users',         usersService.getUsers({ limit: 5 }),                     (r) => setRecentUsers(r?.data || [])),
      safe('admin/transfers',     transfersService.getTransfers({ limit: 5 }),              (r) => setRecentTransfers(r?.data || [])),
      safe('admin/conversations', supportService.getConversations({ status: 'waiting', limit: 5 }), (r) => setOpenChats(r?.data || [])),
    ]).finally(() => setPageLoading(false));

    let cleanups = [];
    connectAdminSocket().then(() => {
      cleanups.push(
        onNewUser((u) => {
          setRecentUsers((prev) => [u, ...prev].slice(0, 5));
          useAnalyticsStore.setState((s) => ({
            overview: s.overview ? { ...s.overview, totalUsers: (s.overview.totalUsers || 0) + 1 } : s.overview,
          }));
        }),
        onNewTransfer((tx) => {
          setRecentTransfers((prev) => [tx, ...prev].slice(0, 5));
        }),
        onNewSupportConversation((convo) => {
          setOpenChats((prev) => {
            if (prev.some((c) => String(c.id) === String(convo.id || convo._id))) return prev;
            return [convo, ...prev].slice(0, 5);
          });
          useAnalyticsStore.setState((s) => ({
            overview: s.overview ? { ...s.overview, openConversations: (s.overview.openConversations || 0) + 1 } : s.overview,
          }));
        }),
      );
    });

    return () => cleanups.forEach((fn) => fn());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stats = overview;

  const STATS = [
    {
      label: 'Total Users',
      value: fmt(stats?.totalUsers),
      color: 'blue',
      icon:  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
    },
    {
      label: 'Active Accounts',
      value: fmt(stats?.totalAccounts),
      color: 'green',
      icon:  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>,
    },
    {
      label: "Today's Transfers",
      value: fmt(stats?.todayTransactions),
      color: 'purple',
      icon:  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>,
    },
    {
      label: 'Frozen Accounts',
      value: fmt(stats?.frozenAccounts),
      color: stats?.frozenAccounts > 0 ? 'amber' : 'slate',
      icon:  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
    },
    {
      label: 'Open Support',
      value: fmt(stats?.openConversations),
      color: stats?.openConversations > 0 ? 'red' : 'slate',
      icon:  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>,
    },
    {
      label: 'Volume Today',
      value: fmtUSD(stats?.todayVolume),
      color: 'green',
      icon:  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    },
  ];

  return (
    <div className="flex-1 overflow-y-auto">
      <AdminTopbar
        title="Dashboard"
        subtitle={`Operational overview · ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`}
      />

      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {STATS.map((s) => (
            <AdminStatsCard key={s.label} {...s} />
          ))}
        </div>

        {/* Recent Transfers + Recent Users */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5">
          {/* Recent Transfers */}
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <SectionHeader title="Recent Transfers" href="/admin/transfers" />
            {recentTransfers.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No transfers found</p>
            ) : (
              <div className="space-y-2">
                {recentTransfers.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-800 truncate">
                        {tx.user ? `${tx.user.firstName} ${tx.user.lastName}` : 'Unknown'}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">{tx.description}</p>
                    </div>
                    <div className="flex-shrink-0 ml-3 text-right">
                      <p className={`text-xs font-semibold ${tx.type === 'credit' ? 'text-green-600' : 'text-slate-700'}`}>
                        {tx.type === 'credit' ? '+' : '-'}{fmtUSD(tx.amount)}
                      </p>
                      <p className="text-[11px] text-slate-400">{fmtDate(tx.transactionDate)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Users */}
          <div className="bg-white border border-slate-200 rounded-lg p-4">
            <SectionHeader title="Recent Users" href="/admin/users" />
            {recentUsers.length === 0 ? (
              <p className="text-xs text-slate-400 py-4 text-center">No users found</p>
            ) : (
              <div className="space-y-2">
                {recentUsers.map((u) => (
                  <Link
                    key={u.id}
                    href={`/admin/users/${u.id}`}
                    className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0 hover:opacity-80 transition-opacity"
                  >
                    <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-blue-700 text-[10px] font-bold">
                        {u.firstName?.[0]}{u.lastName?.[0]}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-slate-800 truncate">
                        {u.firstName} {u.lastName}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">{u.email}</p>
                    </div>
                    <AdminBadge label={u.isVerified ? 'Verified' : 'Unverified'} variant={u.isVerified ? 'active' : 'pending'} />
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Open Support Conversations */}
        <div className="bg-white border border-slate-200 rounded-lg p-4">
          <SectionHeader title="Open Support Conversations" href="/admin/support" />
          {openChats.length === 0 ? (
            <p className="text-xs text-slate-400 py-3 text-center">No open conversations</p>
          ) : (
            <div className="divide-y divide-slate-50">
              {openChats.map((c) => (
                <div key={c.id} className="flex items-start sm:items-center justify-between py-2.5 gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0 mt-0.5 sm:mt-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-slate-800 truncate">
                        {c.user ? `${c.user.firstName} ${c.user.lastName}` : 'Anonymous'}
                      </p>
                      <p className="text-[11px] text-slate-400 truncate">{c.source} · {fmtDate(c.lastMessageAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <AdminBadge label={c.status} variant={c.status} />
                    <span className="hidden sm:block">
                      <AdminBadge label={c.priority} variant={c.priority} />
                    </span>
                    <Link href="/admin/support" className="text-xs text-blue-600 hover:underline whitespace-nowrap">Open →</Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
