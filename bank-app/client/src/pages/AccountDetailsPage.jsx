import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import LegalDisclosure from '../components/LegalDisclosure';
import InsetDivider from '../components/InsetDivider';
import AppHeader from '../components/AppHeader';
import BottomNavigation from '../components/BottomNavigation';
import EricaSearchBar from '../components/EricaSearchBar';
import { useDashboardStore } from '../store/dashboardStore';
import { dashboardService } from '../services/dashboardService';
import { formatBalance, formatAmount, txStatusLabel, toDetailPayload } from '../utils/format';
import imgPiggyBank from '../assets/images/piggybank.jpeg';
import imgApplePay from '../assets/images/applepay-log.png';
import imgPayPal   from '../assets/images/paypal-logo.png';
import imgAdidas   from '../assets/images/logo-adidas.png';
import imgLowes    from '../assets/images/logo-lowes.png';
import imgUlta     from '../assets/images/logo-ulta.png';
import imgGoal     from '../assets/images/goal-chart.jpeg';

const MASK_DELAY_MS = 15000;

const deals = [
  { logo: imgAdidas, name: 'Adidas',      cashback: '5% Cash Back' },
  { logo: imgLowes,  name: "Lowe's",      cashback: '1% Cash Back' },
  { logo: imgUlta,   name: 'Ulta Beauty', cashback: '5% Cash Back' },
];

/* ─────────────────────────────────────────────
   Page-specific SVG icons
───────────────────────────────────────────── */
const ChevronRight = () => (
  <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);
const ChevronDown = () => (
  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);
const IconInfo = () => (
  <svg className="w-5 h-5 text-[#1a6bbf]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" strokeWidth={1.5} />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 16v-4M12 8h.01" />
  </svg>
);

/* ─────────────────────────────────────────────
   Google Charts bar chart (Income vs Spending)
   Accepts real income/spending from API data.
───────────────────────────────────────────── */
function SpendingChart({ income = 0, spending = 0 }) {
  const chartRef  = useRef(null);
  const chartInst = useRef(null);
  const isReady   = useRef(false);

  function draw(inc, sp) {
    if (!isReady.current || !chartRef.current) return;
    const data = window.google.visualization.arrayToDataTable([
      ['Type', 'Amount', { role: 'style' }],
      ['Income',   inc, '#9E9E9E'],
      ['Spending', sp,  '#1a6bbf'],
    ]);
    const options = {
      legend:          'none',
      chartArea:       { width: '85%', height: '75%' },
      backgroundColor: 'transparent',
      bar:             { groupWidth: '55%' },
      vAxis:           { gridlines: { color: 'transparent' }, textPosition: 'none', baselineColor: '#ccc' },
      hAxis:           { textStyle: { color: '#6B7280', fontSize: 10 } },
    };
    if (!chartInst.current) {
      chartInst.current = new window.google.visualization.ColumnChart(chartRef.current);
    }
    chartInst.current.draw(data, options);
  }

  // Load Google Charts once on mount
  useEffect(() => {
    function onReady() { isReady.current = true; draw(income, spending); }
    function loadAndDraw() {
      window.google.charts.load('current', { packages: ['corechart'] });
      window.google.charts.setOnLoadCallback(onReady);
    }
    if (window.google?.visualization) { onReady(); return; }
    if (window.google?.charts)        { loadAndDraw(); return; }
    const existing = document.getElementById('google-charts-script');
    if (existing) { existing.addEventListener('load', loadAndDraw); return; }
    const script  = document.createElement('script');
    script.id     = 'google-charts-script';
    script.src    = 'https://www.gstatic.com/charts/loader.js';
    script.onload = loadAndDraw;
    document.head.appendChild(script);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Redraw whenever income or spending changes
  useEffect(() => {
    draw(income, spending);
  }, [income, spending]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div ref={chartRef} style={{ width: '160px', height: '120px' }} aria-label="Income vs Spending bar chart" />
  );
}

/* ─────────────────────────────────────────────
   Main page component
───────────────────────────────────────────── */
function AccountDetailsPage() {
  const navigate = useNavigate();
  const { state } = useLocation();

  const [routingOpen,    setRoutingOpen]    = useState(false);
  const [statusOpen,     setStatusOpen]     = useState(false);
  const [accountTxs,     setAccountTxs]     = useState([]);
  const [loadingTxs,     setLoadingTxs]     = useState(false);

  // Account number reveal
  const [showAcctNum,    setShowAcctNum]    = useState(false);
  const [fullAcctNum,    setFullAcctNum]    = useState(null);
  const [loadingAcctNum, setLoadingAcctNum] = useState(false);
  const maskTimerRef = useRef(null);

  // Routing number copy feedback
  const [copied, setCopied] = useState(false);

  // Account comes from Dashboard navigation state; fall back to primary store account
  const { accounts, loadingAccounts, fetchAccounts } = useDashboardStore();
  const routeAccount  = state?.account || null;
  const storeAccount  = accounts.find((a) => a.isPrimary) || accounts[0] || null;
  const account       = routeAccount || storeAccount;

  // Fetch store accounts only when arriving directly (no route state)
  useEffect(() => {
    if (!routeAccount) fetchAccounts();
  }, [routeAccount, fetchAccounts]);

  // Fetch transactions filtered to this account whenever the account ID is known
  useEffect(() => {
    if (!account?.id) return;
    setLoadingTxs(true);
    setAccountTxs([]);
    dashboardService
      .getTransactions({ accountId: account.id, limit: 20 })
      .then((res) => setAccountTxs(res?.data || []))
      .catch(() => setAccountTxs([]))
      .finally(() => setLoadingTxs(false));
  }, [account?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cleanup auto-mask timer on unmount
  useEffect(() => () => { if (maskTimerRef.current) clearTimeout(maskTimerRef.current); }, []);

  const startMaskTimer = () => {
    if (maskTimerRef.current) clearTimeout(maskTimerRef.current);
    maskTimerRef.current = setTimeout(() => setShowAcctNum(false), MASK_DELAY_MS);
  };

  const handleAccountNumberClick = async () => {
    if (!account?.id) return;
    if (showAcctNum) {
      setShowAcctNum(false);
      if (maskTimerRef.current) clearTimeout(maskTimerRef.current);
      return;
    }
    if (fullAcctNum) {
      setShowAcctNum(true);
      startMaskTimer();
      return;
    }
    setLoadingAcctNum(true);
    try {
      const res = await dashboardService.getAccountNumber(account.id);
      setFullAcctNum(res.data.accountNumber);
      setShowAcctNum(true);
      startMaskTimer();
    } catch {
      // silently keep masked
    } finally {
      setLoadingAcctNum(false);
    }
  };

  const handleRoutingCopy = () => {
    const num = account?.routingNumber;
    if (!num) return;
    navigator.clipboard.writeText(num).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };

  // Compute this month's income and spending from real transactions
  const now = new Date();
  const thisMonthTxs = accountTxs.filter((tx) => {
    const d = new Date(tx.transactionDate);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });
  const monthlyIncome   = thisMonthTxs.filter((tx) => tx.type === 'credit').reduce((s, tx) => s + tx.amount, 0);
  const monthlySpending = thisMonthTxs.filter((tx) => tx.type === 'debit').reduce((s, tx) => s + tx.amount, 0);
  const spendingDiff    = Math.abs(monthlyIncome - monthlySpending);
  const isSaving        = monthlyIncome >= monthlySpending;

  return (
    <div className="flex flex-col h-screen bg-gray-100 font-sans">

      <AppHeader
        showBackButton
        showInbox
        inboxCount={1}
        showProducts
        showLogout
        iconGap={5}
      />

      {/* ════════════════════════════════
          SCROLLABLE BODY
      ════════════════════════════════ */}
      <div className="flex-1 overflow-y-auto pt-[64px] pb-20">

        <EricaSearchBar ericaCount={2} showProviderText />

        {/* ── Account overview ── */}
        <section className="px-4 pt-6 pb-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-extrabold text-gray-900 tracking-wide">
              {!account && loadingAccounts
                ? <span className="text-gray-200 animate-pulse">——</span>
                : account?.accountName?.toUpperCase() ?? '——'}
            </h2>
            <button type="button" className="text-[#1a6bbf] font-bold text-base tracking-wide">EDIT</button>
          </div>
          <div className="flex flex-col items-center">
            <p className="text-5xl font-bold text-gray-900 mb-2">
              {!account && loadingAccounts
                ? <span className="text-gray-200 animate-pulse">$——.——</span>
                : formatBalance(account?.availableBalance)}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-gray-500 text-sm font-normal">Available balance</span>
              <IconInfo />
            </div>
          </div>
        </section>

        {/* ── Account & routing numbers ── */}
        <div className="mx-4 mb-3 bg-white rounded-2xl shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => setRoutingOpen(!routingOpen)}
            className="w-full flex items-center justify-between px-5 py-4"
          >
            <span className="text-gray-900 text-base font-medium">Account &amp; routing numbers</span>
            <ChevronDown />
          </button>
          {routingOpen && (
            <>
              <InsetDivider color={100} />
              <div className="px-5 pb-4">
                <div className="pt-4 space-y-3">

                  {/* Account number row — tap to reveal/hide */}
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={handleAccountNumberClick}
                      className="flex items-center gap-2 text-left"
                      disabled={loadingAcctNum}
                    >
                      <span className="text-sm text-gray-500">Account number</span>
                      <span className="text-xs font-semibold text-[#1a6bbf]">
                        {loadingAcctNum ? '…' : showAcctNum ? 'Hide' : 'Show'}
                      </span>
                    </button>
                    <span className="text-sm font-medium text-gray-900 font-mono tracking-wider">
                      {loadingAcctNum
                        ? '…'
                        : showAcctNum && fullAcctNum
                          ? fullAcctNum
                          : account?.maskedAccountNumber ?? '••••••••••'}
                    </span>
                  </div>

                  <InsetDivider color={100} />

                  {/* Routing number row — tap to copy */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Routing number</span>
                    <button
                      type="button"
                      onClick={handleRoutingCopy}
                      className="flex items-center gap-2"
                    >
                      <span className="text-sm font-medium text-gray-900">
                        {account?.routingNumber ?? '—'}
                      </span>
                      <span className={`text-xs font-semibold transition-colors ${copied ? 'text-green-600' : 'text-[#1a6bbf]'}`}>
                        {copied ? 'Copied' : 'Copy'}
                      </span>
                    </button>
                  </div>

                </div>
              </div>
            </>
          )}
        </div>

        {/* ── Status tracker ── */}
        <div className="mx-4 mb-3 bg-white rounded-2xl shadow-sm overflow-hidden">
          <button
            type="button"
            onClick={() => setStatusOpen(!statusOpen)}
            className="w-full flex items-start justify-between px-5 py-4"
          >
            <div className="text-left pr-3">
              <p className="text-gray-900 text-base font-medium">Status tracker</p>
              <p className="text-gray-500 text-sm leading-snug mt-0.5">
                For service items, claims and requests for this account
              </p>
            </div>
            <ChevronDown />
          </button>
        </div>

        {/* ── Recent Transactions ── */}
        <div className="mx-4 mb-3 bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 pt-5 pb-2">
            <p className="text-gray-400 text-xs font-semibold tracking-widest uppercase mb-4">
              Recent Transactions
            </p>
            <div className="space-y-0">
              {loadingTxs ? (
                [1, 2, 3].map((n) => (
                  <div key={n} className="py-3 animate-pulse">
                    <div className="h-2.5 bg-gray-100 rounded w-20 mb-2" />
                    <div className="h-3.5 bg-gray-100 rounded w-48" />
                  </div>
                ))
              ) : accountTxs.length === 0 ? (
                <p className="text-gray-400 text-sm py-4 text-center">No recent transactions.</p>
              ) : (
                accountTxs.map((tx, i) => (
                  <div key={tx.id || i}>
                    <button
                      type="button"
                      onClick={() =>
                        navigate('/transaction-details', { state: { transaction: toDetailPayload(tx) } })
                      }
                      className="w-full flex items-start justify-between py-3 text-left active:bg-gray-50"
                    >
                      <div className="flex-1 pr-4">
                        <p className="text-gray-500 text-xs font-normal mb-0.5">
                          {txStatusLabel(tx)}
                        </p>
                        <p className="text-gray-900 text-sm font-bold leading-snug">
                          {tx.description}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-[#1a6bbf]">{formatAmount(tx)}</p>
                        <p className="text-gray-500 text-xs font-normal">
                          {formatBalance(tx.balanceAfter)}
                        </p>
                      </div>
                    </button>
                    {i < accountTxs.length - 1 && <InsetDivider color={100} />}
                  </div>
                ))
              )}
            </div>
          </div>
          <InsetDivider color={100} />
          <button type="button" className="w-full py-4 text-[#1a6bbf] font-bold text-sm tracking-wider">
            ALL TRANSACTIONS
          </button>
        </div>

        {/* ── Spending & Budgeting ── */}
        <div className="mx-4 mb-3 bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 pt-5 pb-4">
            <p className="text-gray-400 text-xs font-semibold tracking-widest uppercase mb-4">
              Spending &amp; Budgeting
            </p>
            <div className="flex items-start gap-4">
              <div className="flex flex-col items-center flex-shrink-0">
                <SpendingChart income={monthlyIncome} spending={monthlySpending} />
                <p className="text-gray-500 text-[10px] font-normal -mt-1">Income / Spending</p>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed">
                {monthlyIncome === 0 && monthlySpending === 0 ? (
                  'No activity recorded this month yet.'
                ) : isSaving ? (
                  <>
                    Nice work! This month you&apos;ve deposited{' '}
                    <span className="text-[#1a6bbf] font-bold">{formatBalance(spendingDiff)} more</span>{' '}
                    than you&apos;ve spent. Setting a budget can help you stay on track.
                  </>
                ) : (
                  <>
                    This month you&apos;ve spent{' '}
                    <span className="text-red-500 font-bold">{formatBalance(spendingDiff)} more</span>{' '}
                    than you&apos;ve deposited. Consider reviewing your expenses.
                  </>
                )}
              </p>
            </div>
          </div>
          <InsetDivider color={100} />
          <button type="button" className="w-full py-4 text-[#1a6bbf] font-bold text-sm tracking-wider">
            TRACK SPENDING
          </button>
        </div>

        {/* ── Goals ── */}
        <div className="mx-4 mb-3 bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 pt-5 pb-4">
            <p className="text-gray-400 text-xs font-semibold tracking-widest uppercase mb-4">Goals</p>
            <div className="flex items-center gap-5">
              <img src={imgGoal} alt="Goals target" className="w-24 h-24 object-contain flex-shrink-0" />
              <p className="text-gray-900 text-lg font-medium leading-snug">
                Easily save for goals like vacations, cars or education.
              </p>
            </div>
          </div>
          <InsetDivider color={100} />
          <button type="button" className="w-full py-4 text-[#1a6bbf] font-bold text-sm tracking-wider">
            CREATE GOAL
          </button>
        </div>

        {/* ── FICO Score ── */}
        <div className="mx-4 mb-3 bg-white rounded-2xl shadow-sm overflow-hidden">
          <button type="button" className="w-full flex items-center justify-between px-5 py-4">
            <div className="text-left">
              <p className="text-gray-900 text-base font-medium">Get your FICO® Score</p>
              <p className="text-gray-500 text-sm font-normal mt-0.5">Monitor your credit health with My Credit</p>
            </div>
            <ChevronRight />
          </button>
        </div>

        {/* ── Mobile Order ── */}
        <div className="mx-4 mb-3 bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 pt-4 pb-1">
            <p className="text-gray-400 text-xs font-semibold tracking-widest uppercase">Mobile Order</p>
          </div>
          <button type="button" className="w-full flex items-center justify-between px-5 py-4">
            <span className="text-gray-900 text-base font-medium">Foreign currency</span>
            <ChevronRight />
          </button>
          <InsetDivider color={100} />
          <button type="button" className="w-full flex items-center justify-between px-5 py-4">
            <span className="text-gray-900 text-base font-medium">View activity</span>
            <ChevronRight />
          </button>
        </div>

        {/* ── Account Management ── */}
        <div className="mx-4 mb-3 bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 pt-4 pb-1">
            <p className="text-gray-400 text-xs font-semibold tracking-widest uppercase">Account Management</p>
          </div>

          <button type="button" onClick={() => navigate('/statements-documents')} className="w-full flex items-center justify-between px-5 py-4">
            <span className="text-gray-900 text-base font-medium">Statements &amp; Documents</span>
            <ChevronRight />
          </button>
          <InsetDivider color={100} />

          <button type="button" className="w-full flex items-center justify-between px-5 py-4">
            <span className="text-gray-900 text-base font-medium">Alerts</span>
            <ChevronRight />
          </button>
          <InsetDivider color={100} />

          <button type="button" className="w-full flex items-start justify-between px-5 py-4">
            <div className="text-left">
              <p className="text-gray-900 text-base font-medium">Debit Card Settings</p>
              <p className="text-gray-500 text-sm font-normal leading-snug mt-0.5">
                Lock/unlock card, order a new or replacement card and more.
              </p>
            </div>
            <ChevronRight />
          </button>
          <InsetDivider color={100} />

          <button type="button" className="w-full flex items-center justify-between px-5 py-4">
            <span className="text-gray-900 text-base font-medium">Beneficiaries</span>
            <ChevronRight />
          </button>
          <InsetDivider color={100} />

          <button type="button" className="w-full flex items-start justify-between px-5 py-4">
            <div className="text-left">
              <p className="text-gray-900 text-base font-medium">Direct Deposit</p>
              <p className="text-gray-500 text-sm font-normal mt-0.5">It's secure and convenient. Set up one today.</p>
            </div>
            <ChevronRight />
          </button>
          <InsetDivider color={100} />

          <button type="button" className="w-full flex items-center justify-between px-5 py-4">
            <span className="text-gray-900 text-base font-medium">Monthly Maintenance Fee info</span>
            <ChevronRight />
          </button>
          <InsetDivider color={100} />

          <button type="button" className="w-full flex items-center justify-between px-5 py-4">
            <div className="text-left">
              <p className="text-gray-900 text-base font-medium leading-snug">
                Balance Connect® for<br />Overdraft Protection
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="text-gray-500 text-sm font-medium">Off</span>
              <ChevronRight />
            </div>
          </button>
        </div>

        {/* ── Keep the Change® ── */}
        <div className="mx-4 mb-3 bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 pt-5 pb-4">
            <p className="text-gray-400 text-xs font-semibold tracking-widest uppercase mb-4">
              Keep the Change®
            </p>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center flex-shrink-0">
                <img src={imgPiggyBank} alt="Piggy bank" className="w-16 h-16 object-contain" />
              </div>
              <p className="text-gray-700 text-sm leading-relaxed">
                Round up each purchase to the nearest dollar and turn spare change into savings
              </p>
            </div>
          </div>
          <InsetDivider color={100} />
          <button type="button" className="w-full py-4 text-[#1a6bbf] font-bold text-sm tracking-wider">
            ENROLL
          </button>
        </div>

        {/* ── Digital Wallets ── */}
        <div className="mx-4 mb-3 bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 pt-4 pb-1">
            <p className="text-gray-400 text-xs font-semibold tracking-widest uppercase">Digital Wallets</p>
          </div>

          <button type="button" className="w-full flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <img src={imgApplePay} alt="Apple Pay" className="h-8 w-auto object-contain" />
              <span className="text-gray-900 text-base font-medium">Add card(s) to Apple Wallet</span>
            </div>
            <ChevronRight />
          </button>
          <InsetDivider color={100} />

          <button type="button" className="w-full flex items-center justify-between px-5 py-4">
            <div className="flex items-center gap-3">
              <img src={imgPayPal} alt="PayPal" className="h-8 w-auto object-contain" />
              <div className="text-left">
                <p className="text-gray-900 text-base font-medium">PayPal</p>
                <p className="text-gray-500 text-sm font-normal">Enjoy fast, secure checkout.</p>
              </div>
            </div>
            <ChevronRight />
          </button>
        </div>

        {/* ── Supplies ── */}
        <div className="mx-4 mb-3 bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-5 pt-4 pb-1">
            <p className="text-gray-400 text-xs font-semibold tracking-widest uppercase">Supplies</p>
          </div>
          <button type="button" className="w-full flex items-center justify-between px-5 py-4">
            <span className="text-gray-900 text-base font-medium">Order Account Supplies/Accessories</span>
            <ChevronRight />
          </button>
          <InsetDivider color={100} />
          <button type="button" className="w-full flex items-center justify-between px-5 py-4">
            <span className="text-gray-900 text-base font-medium">Get copies of Cleared Checks</span>
            <ChevronRight />
          </button>
        </div>

        {/* ── BankMoltenDeals® ── */}
        <div className="mx-4 mb-3 bg-white rounded-2xl shadow-sm overflow-hidden">
          <p className="px-5 pt-5 pb-3 text-gray-400 text-[11px] font-semibold tracking-widest uppercase">
            BankMoltenDeals®
          </p>
          <div
            className="flex gap-3 px-5 pb-4 overflow-x-auto"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {deals.map((deal, i) => (
              <div key={i} className="flex-shrink-0 w-36 border border-gray-200 rounded-xl p-3 flex flex-col items-center">
                <div className="w-full h-20 flex items-center justify-center mb-2">
                  <img src={deal.logo} alt={deal.name} className="max-h-full max-w-full object-contain" />
                </div>
                <p className="text-gray-900 text-sm font-semibold text-center">{deal.name}</p>
                <p className="text-gray-700 text-sm font-bold text-center">{deal.cashback}</p>
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-2 pb-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className={`w-2 h-2 rounded-full ${i === 0 ? 'bg-gray-800' : 'bg-gray-300'}`} />
            ))}
          </div>
          <InsetDivider color={100} />
          <button type="button" className="w-full py-4 text-[#1a6bbf] font-semibold text-sm tracking-wider">
            VIEW ALL DEALS
          </button>
        </div>

        {/* ── Contact us ── */}
        <div className="mx-4 mb-4 bg-white rounded-2xl shadow-sm overflow-hidden">
          <button type="button" className="w-full flex items-center justify-between px-5 py-5">
            <span className="text-gray-900 text-base font-medium">Contact us</span>
            <ChevronRight />
          </button>
        </div>

        <LegalDisclosure />
      </div>

      <BottomNavigation activeTab="accounts" />

    </div>
  );
}

export default AccountDetailsPage;
