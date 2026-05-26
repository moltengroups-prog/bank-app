import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LegalDisclosure from '../components/LegalDisclosure';
import InsetDivider from '../components/InsetDivider';
import AppHeader from '../components/AppHeader';
import FdicBanner from '../components/FdicBanner';
import BottomNavigation from '../components/BottomNavigation';
import EricaSearchBar from '../components/EricaSearchBar';
import logo from '../assets/logos/logo.png';
import imgBanner from '../assets/images/banner-rate-reduction.jpeg';
import imgNotepad from '../assets/images/icon-notepad.jpeg';
import imgAdidas from '../assets/images/logo-adidas.png';
import imgLowes from '../assets/images/logo-lowes.png';
import imgUlta from '../assets/images/logo-ulta.png';
import { useDashboardStore } from '../store/dashboardStore';
import { useAuthStore } from '../store/authStore';
import { useNotificationStore } from '../store/notificationStore';
import { formatBalance } from '../utils/format';
import { onNewNotification } from '../socket/notificationSocket';
import { getSocket } from '../socket/socket';

const deals = [
  { logo: imgAdidas, name: 'Adidas',      cashback: '5% Cash Back' },
  { logo: imgLowes,  name: "Lowe's",      cashback: '1% Cash Back' },
  { logo: imgUlta,   name: 'Ulta Beauty', cashback: '5% Cash Back' },
];

const IconChevronRight = () => (
  <span className="text-gray-400 text-xl leading-none">&#8250;</span>
);
const IconChevronUp = ({ flipped }) => (
  <svg className={`w-5 h-5 text-gray-500 transition-transform ${flipped ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
  </svg>
);

function DashboardPage() {
  const navigate = useNavigate();
  const [bankingOpen, setBankingOpen] = useState(true);

  // Granular selectors — component only re-renders when these specific fields change,
  // not when unrelated store fields (e.g. loadingTransactions) update.
  const accounts        = useDashboardStore((s) => s.accounts);
  const loadingAccounts = useDashboardStore((s) => s.loadingAccounts);
  const fetchAccounts   = useDashboardStore((s) => s.fetchAccounts);
  const refreshAccounts = useDashboardStore((s) => s.refreshAccounts);
  const user            = useAuthStore((s) => s.user);
  const unreadCount     = useNotificationStore((s) => s.unreadCount);
  const fetchUnreadCount = useNotificationStore((s) => s.fetchUnreadCount);

  useEffect(() => {
    fetchAccounts();
    fetchUnreadCount();
  // Zustand methods are stable references — safe to list as deps
  }, [fetchAccounts, fetchUnreadCount]);

  // Silent refresh on transfer notification — avoids loading skeleton flicker
  useEffect(() => {
    return onNewNotification((n) => {
      if (n.category === 'transfer') refreshAccounts();
    });
  }, [refreshAccounts]);

  // Direct balance update from admin adjustments and wire settlements
  useEffect(() => {
    const s = getSocket();
    if (!s) return;
    const onBalanceUpdated = () => refreshAccounts();
    const onWireSettled    = () => refreshAccounts();
    s.on('balance:updated', onBalanceUpdated);
    s.on('wire:settled',    onWireSettled);
    return () => {
      s.off('balance:updated', onBalanceUpdated);
      s.off('wire:settled',    onWireSettled);
    };
  // getSocket() returns a module-level singleton; no deps needed
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshAccounts]);

  return (
    <div className="flex flex-col h-screen bg-gray-100 font-sans">

      <AppHeader
        showMenuButton
        showInbox
        inboxCount={unreadCount}
        showProducts
        showLogout
        iconGap={5}
        showAccountsNav
        activeSubNav="accounts"
      />

      {/* ══════════════════════════════════
          SCROLLABLE BODY
      ══════════════════════════════════ */}
      <div className="flex-1 overflow-y-auto pt-[104px] pb-20">

        <EricaSearchBar ericaCount={2} bgWhite={false} />

        {/* ── Greeting card ── */}
        <div className="mx-4 mb-4 bg-white rounded-2xl shadow-sm overflow-hidden">
          <button type="button" className="w-full flex items-center justify-between px-5 py-4 active:bg-gray-50">
            <span className="font-bold text-gray-900 text-base">
              Hello{user?.firstName ? `, ${user.firstName}` : ''}
            </span>
            <IconChevronRight />
          </button>
          <InsetDivider color={100} />
          <button type="button" className="w-full flex items-start justify-between px-5 py-4 active:bg-gray-50">
            <div className="text-left pr-3">
              <p className="font-bold text-gray-900 text-base">Bank of Molten Life Plan&#174;</p>
              <p className="text-gray-500 text-sm mt-1 leading-relaxed">
                Your next steps and new features are a tap away.
              </p>
            </div>
            <IconChevronRight />
          </button>
          <InsetDivider color={100} />
          <button type="button" className="w-full flex items-center justify-between px-5 py-4 active:bg-gray-50">
            <span className="text-gray-800 text-base font-medium">My Rewards</span>
            <IconChevronRight />
          </button>
        </div>

        {/* ── Banking card ── */}
        <div className="mx-4 mb-4 bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="h-1.5 flex">
            <div className="w-1/2 bg-red-600" />
            <div className="w-1/2 bg-[#002D72]" />
          </div>

          <button
            type="button"
            onClick={() => setBankingOpen(!bankingOpen)}
            className="w-full flex items-center justify-between px-5 py-4"
          >
            <span className="font-bold text-gray-900 text-base">Banking</span>
            <IconChevronUp flipped={!bankingOpen} />
          </button>
          <InsetDivider color={100} />

          {bankingOpen && (
            <>
              <div className="px-5 pt-4 pb-3">
                <div className="flex items-center gap-2 mb-1.5">
                  <img src={logo} alt="Bank of Molten" className="h-5 w-auto" />
                  <span className="font-bold text-gray-900 text-sm">Bank of Molten</span>
                </div>
                <FdicBanner size="sm" />
              </div>
              <InsetDivider color={100} />

              {loadingAccounts ? (
                [1, 2].map((n) => (
                  <div key={n} className="flex items-center justify-between px-5 py-4 animate-pulse">
                    <div className="h-3 bg-gray-100 rounded w-32" />
                    <div className="h-4 bg-gray-100 rounded w-20" />
                  </div>
                ))
              ) : accounts.length === 0 ? (
                <p className="px-5 py-4 text-gray-400 text-sm">No accounts found.</p>
              ) : (
                accounts.map((acc, i) => (
                  <React.Fragment key={acc.id}>
                    <button
                      type="button"
                      onClick={() => navigate('/account', { state: { account: acc } })}
                      className="w-full flex items-center justify-between px-5 py-4 active:bg-gray-50"
                    >
                      <span className="text-gray-800 text-sm font-medium">{acc.accountName}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900 text-base">
                          {formatBalance(acc.availableBalance)}
                        </span>
                        <IconChevronRight />
                      </div>
                    </button>
                    {i < accounts.length - 1 && <InsetDivider color={100} />}
                  </React.Fragment>
                ))
              )}
            </>
          )}
        </div>

        {/* ── There's more to explore ── */}
        <div className="mx-4 mb-4 bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="flex items-start gap-4 px-5 pt-5 pb-4">
            <img src={imgNotepad} alt="Explore" className="w-14 h-14 object-contain flex-shrink-0" />
            <div>
              <p className="font-bold text-gray-900 text-base mb-1">There's more to explore</p>
              <p className="text-gray-600 text-sm leading-relaxed">
                Explore Bank of Molten credit cards, loans, checking and savings accounts, plus Merrill investment solutions.
              </p>
            </div>
          </div>
          <InsetDivider color={100} />
          <div className="flex divide-x divide-gray-200">
            <button type="button" className="flex-1 py-4 text-[#1a6bbf] font-semibold text-sm tracking-wider active:bg-gray-50">
              OFFERS
            </button>
            <button type="button" className="flex-1 py-4 text-[#1a6bbf] font-semibold text-sm tracking-wider active:bg-gray-50">
              PRODUCTS
            </button>
          </div>
        </div>

        {/* ── Promotional banner ── */}
        <div className="mb-4">
          <img src={imgBanner} alt="Rate reduction on auto loans" className="w-full object-cover" />
        </div>

        {/* ── BankAmeriDeals ── */}
        <div className="mx-4 mb-4 bg-white rounded-2xl shadow-sm overflow-hidden">
          <p className="px-5 pt-5 pb-3 text-gray-400 text-[11px] font-semibold tracking-widest uppercase">
            BankMoltenDeals&#174;
          </p>

          <div
            className="flex gap-3 px-5 pb-4 overflow-x-auto"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {deals.map((deal, i) => (
              <div
                key={i}
                className="flex-shrink-0 w-36 border border-gray-200 rounded-xl p-3 flex flex-col items-center"
              >
                <div className="w-full h-20 flex items-center justify-center mb-2">
                  <img
                    src={deal.logo}
                    alt={deal.name}
                    className="max-h-full max-w-full object-contain"
                  />
                </div>
                <p className="text-gray-900 text-sm font-semibold text-center">{deal.name}</p>
                <p className="text-gray-700 text-sm font-bold text-center">{deal.cashback}</p>
              </div>
            ))}
          </div>

          <div className="flex justify-center gap-2 pb-3">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-gray-800' : 'bg-gray-300'}`}
              />
            ))}
          </div>

          <InsetDivider color={100} />
          <button type="button" className="w-full py-4 text-[#1a6bbf] font-semibold text-sm tracking-wider active:bg-gray-50">
            VIEW ALL DEALS
          </button>
        </div>

        {/* ── Account Information ── */}
        <div className="px-4 py-4">
          <p className="text-gray-500 text-base font-normal mb-4">Account information</p>
          <InsetDivider inset={false} className="mb-6" />
          <button type="button" className="text-[#1a6bbf] font-bold text-base">Account Balance Footnotes</button>
          <InsetDivider inset={false} className="mt-6" />
        </div>

        <LegalDisclosure />
      </div>

      <BottomNavigation activeTab="accounts" />

    </div>
  );
}

export default DashboardPage;
