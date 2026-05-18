import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import LegalDisclosure from '../components/LegalDisclosure';
import AppHeader from '../components/AppHeader';
import BottomNavigation from '../components/BottomNavigation';
import { useDashboardStore } from '../store/dashboardStore';
import { useNotificationStore } from '../store/notificationStore';
import { formatBalance } from '../utils/format';

import imgAvailBal    from '../assets/images/available-balance.png';
import imgAvgSpend    from '../assets/images/spending-chart.jpeg';
import imgAdidas      from '../assets/images/logo-adidas.png';
import imgAlerts      from '../assets/images/alerts.jpeg';
import imgBetterMoney from '../assets/images/better-money-habits.png';

/* ── Reusable card shell ── */
function DashCard({ children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="bg-white rounded-2xl shadow-sm flex flex-col items-center justify-start p-4 w-full text-center active:bg-gray-50 min-h-[180px]"
    >
      {children}
    </button>
  );
}

function MainDashboardPage() {
  const navigate     = useNavigate();
  const { accounts, transactions, loadingAccounts, loadingTransactions, fetchAccounts, fetchTransactions } = useDashboardStore();
  const { unreadCount, fetchUnreadCount } = useNotificationStore();
  const checking     = accounts.find((a) => a.accountType === 'checking') || accounts[0] || null;

  useEffect(() => {
    fetchAccounts();
    fetchUnreadCount();
    // Fetch last 90 days for avg spend calculation
    const since = new Date();
    since.setDate(since.getDate() - 90);
    fetchTransactions({ startDate: since.toISOString().split('T')[0], limit: 500 });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Average monthly spend: sum all debit amounts grouped by calendar month, then average
  const avgMonthlySpend = useMemo(() => {
    const debits = transactions.filter(
      (t) => t.transactionType === 'debit' || t.amount < 0
    );
    if (debits.length === 0) return null;

    const byMonth = {};
    debits.forEach((t) => {
      const d = new Date(t.date || t.createdAt);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      const amt = Math.abs(t.amount);
      byMonth[key] = (byMonth[key] || 0) + amt;
    });

    const monthTotals = Object.values(byMonth);
    return Math.round(monthTotals.reduce((s, v) => s + v, 0) / monthTotals.length);
  }, [transactions]);

  return (
    <div className="flex flex-col h-screen bg-gray-100 font-sans">

      <AppHeader
        showMenuButton
        showEricaInline
        ericaInlineCount={2}
        showInbox
        inboxCount={1}
        showProducts
        showLogout
        iconGap={3}
        showAccountsNav
        activeSubNav="dashboard"
        showSubNavDivider
      />

      {/* ══════════════════════════════════
          SCROLLABLE BODY
      ══════════════════════════════════ */}
      <div className="flex-1 overflow-y-auto pt-[104px] pb-20">

        {/* ── 2-column card grid ── */}
        <div className="grid grid-cols-2 gap-3 px-3 pt-4 pb-3">

          {/* Card 1 — Available Balance */}
          <DashCard onClick={() => navigate('/dashboard')}>
            <img
              src={imgAvailBal}
              alt="Available balance"
              className="w-24 h-20 object-contain mb-1"
            />
            <p className="text-gray-500 text-sm font-normal mb-1">
              {checking?.accountName ?? 'joint'}
            </p>
            <p className="text-gray-900 text-2xl font-bold leading-tight">
              {loadingAccounts
                ? <span className="text-gray-300 animate-pulse">$——.——</span>
                : formatBalance(checking?.availableBalance)}
            </p>
            <p className="text-gray-400 text-xs font-normal mt-1">Available balance</p>
          </DashCard>

          {/* Card 2 — Average Spend */}
          <DashCard>
            <img
              src={imgAvgSpend}
              alt="Average spending chart"
              className="w-20 h-14 object-contain mb-3"
            />
            <p className="text-gray-500 text-xs font-normal leading-snug mb-1">
              On Average You Spend
            </p>
            {loadingTransactions ? (
              <span className="text-gray-300 text-2xl font-bold animate-pulse">$——</span>
            ) : (
              <p className="text-gray-900 text-2xl font-bold leading-tight">
                {avgMonthlySpend != null ? `$${avgMonthlySpend.toLocaleString()}` : '—'}
              </p>
            )}
            <p className="text-gray-400 text-xs font-normal mt-1 leading-snug">
              Per Month
            </p>
          </DashCard>

          {/* Card 3 — BankAmeriDeals (Adidas) */}
          <DashCard>
            <p className="text-gray-400 text-[9px] font-semibold tracking-widest uppercase mb-2 self-start">
              BankAmeriDeals&#174;
            </p>
            <img
              src={imgAdidas}
              alt="Adidas"
              className="w-full h-16 object-contain mb-2"
            />
            <p className="text-gray-900 text-sm font-semibold">Adidas</p>
            <p className="text-gray-900 text-sm font-bold">5% Cash back</p>
          </DashCard>

          {/* Card 4 — Alerts */}
          <DashCard>
            <div className="relative mb-3">
              <img
                src={imgAlerts}
                alt="Alerts"
                className="w-14 h-14 object-contain"
              />
            </div>
            <p className="text-gray-900 text-sm font-semibold mb-1">Alerts</p>
            <p className="text-gray-900 text-3xl font-bold leading-tight">{unreadCount}</p>
            <p className="text-gray-400 text-xs font-normal mt-1">Unread</p>
          </DashCard>

          {/* Card 5 — Better Money Habits */}
          <DashCard>
            <img
              src={imgBetterMoney}
              alt="Better Money Habits"
              className="w-16 h-16 object-contain mb-3"
            />
            <p className="text-gray-900 text-sm font-semibold leading-snug mb-1">
              Better Money Habits&#174;
            </p>
            <p className="text-gray-400 text-xs font-normal leading-snug">
              Make sense of your finances
            </p>
          </DashCard>

          {/* Card 6 — Zelle */}
          <DashCard>
            <div className="flex items-center justify-center h-16 mb-3">
              <p className="text-[#6D1ED4] text-3xl font-bold italic tracking-tight">
                Zelle<span className="text-lg align-super font-normal">&#174;</span>
              </p>
            </div>
            <p className="text-gray-700 text-sm font-medium leading-snug">
              Send or Request Money
            </p>
          </DashCard>

        </div>

        {/* ── Customize button ── */}
        <div className="px-4 py-4">
          <button
            type="button"
            className="w-full bg-[#002D72] text-white font-bold text-sm tracking-widest py-4 rounded-full"
          >
            CUSTOMIZE MY DASHBOARD
          </button>
        </div>

        {/* ── Balance disclaimers ── */}
        <div className="px-4 pb-6 space-y-4">
          <p className="text-sm text-gray-700 leading-relaxed">
            For checking, savings, and money market accounts, the balance may reflect
            transactions that have not yet posted to your account. For credit card, Gold
            Option, Gold Reserve and personal line of credit accounts, the balance may not
            reflect recent transactions or pending payments.
          </p>
          <p className="text-sm text-gray-700 leading-relaxed">
            Amount shown for loan products is principal balance only and is current as of
            previous business day's closing. This amount does not include any applicable
            accrued interest and/or fees. Refer to your monthly billing statement for more
            information.
          </p>
          <p className="text-sm text-gray-700 leading-relaxed">
            The data displayed for your Merrill account(s) is for informational purposes
            only. Your account statement is the official record of your holdings and balances.
          </p>
        </div>

        <LegalDisclosure />
      </div>

      <BottomNavigation activeTab="accounts" />

    </div>
  );
}

export default MainDashboardPage;
