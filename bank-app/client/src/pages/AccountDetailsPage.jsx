import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import LegalDisclosure from '../components/LegalDisclosure';
import InsetDivider from '../components/InsetDivider';
import AppHeader from '../components/AppHeader';
import BottomNavigation from '../components/BottomNavigation';
import EricaSearchBar from '../components/EricaSearchBar';
import imgPiggyBank from '../assets/images/piggybank.jpeg';
import imgApplePay from '../assets/images/applepay-log.png';
import imgPayPal   from '../assets/images/paypal-logo.png';
import imgAdidas   from '../assets/images/logo-adidas.png';
import imgLowes    from '../assets/images/logo-lowes.png';
import imgUlta     from '../assets/images/logo-ulta.png';
import imgGoal     from '../assets/images/goal-chart.jpeg';

/* ─────────────────────────────────────────────
   Static data
───────────────────────────────────────────── */
const transactions = [
  {
    status: 'Processing',
    description: 'PMNT SENT 05/03\nCASH APP*SUTRINA\nCLARK OAKLAND CA',
    amount: '-$100.00',
    balance: '$664.89',
    debit: true,
    transactionDate: '05/03/2026',
    type: 'Debit Card',
    onlinePurchase: 'Y',
    merchant: 'SQUARE CASH',
    category: 'Cash, Checks & Misc:Other Expenses',
  },
  {
    status: 'Processing',
    description: 'WM SUPERCENTER\n#745 05/02\n#XXXXX0542462\nPURCHASE 5600 N\nHENRY BLVD\nSTOCKBRIDGE GA',
    amount: '-$120.47',
    balance: '$764.89',
    debit: true,
    transactionDate: '05/02/2026',
    type: 'Debit Card',
    onlinePurchase: 'N',
    merchant: 'WALMART SUPERCENTER',
    category: 'Groceries & Supermarkets',
  },
  {
    status: 'Processing',
    description: 'FOOD DEPOT STOC\n05/02\n#XXXXX0414096\nPURCHASE FOOD\nDEPOT STOC',
    amount: '-$17.22',
    balance: '$885.36',
    debit: true,
    transactionDate: '05/02/2026',
    type: 'Debit Card',
    onlinePurchase: 'N',
    merchant: 'FOOD DEPOT',
    category: 'Groceries & Supermarkets',
  },
  {
    status: 'May 1, 2026',
    description: 'Online Banking transfer\nto CHK 3580\nConfirmation#\nXXXXX27445',
    amount: '-$200.00',
    balance: '$1,357.90',
    debit: true,
    transactionDate: '05/01/2026',
    type: 'ACH',
    onlinePurchase: 'N',
    merchant: 'BANK OF MOLTEN',
    category: 'Transfers',
  },
  {
    status: 'May 1, 2026',
    description: 'AT&T SERVICES\nDES:PAYROLL\nID:260501JC5406\nINDN:JOSEPH S CLARK\nCO ID:XXXXX82655\nPPD',
    amount: '$1,139.15',
    balance: '$1,557.90',
    debit: false,
    transactionDate: '05/01/2026',
    type: 'ACH',
    onlinePurchase: 'N',
    merchant: 'AT&T SERVICES',
    category: 'Income',
  },
  {
    status: 'Apr 29, 2026',
    description: 'CASH APP*SUTRINA\nCLARK* 04/28 PMNT\nSENT Oakland CA',
    amount: '-$50.00',
    balance: '$418.75',
    debit: true,
    transactionDate: '04/28/2026',
    type: 'Debit Card',
    onlinePurchase: 'Y',
    merchant: 'SQUARE CASH',
    category: 'Cash, Checks & Misc:Other Expenses',
  },
];

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
───────────────────────────────────────────── */
function SpendingChart() {
  const chartRef = useRef(null);
  const drawn    = useRef(false);

  useEffect(() => {
    if (drawn.current) return;

    function drawChart() {
      if (!window.google || !window.google.visualization) return;
      drawn.current = true;

      const data = window.google.visualization.arrayToDataTable([
        ['Type', 'Amount', { role: 'style' }],
        ['Income',   1139.15, '#9E9E9E'],
        ['Spending',  357.69, '#1a6bbf'],
      ]);

      const options = {
        legend:      'none',
        chartArea:   { width: '85%', height: '75%' },
        backgroundColor: 'transparent',
        bar:         { groupWidth: '55%' },
        vAxis:       { gridlines: { color: 'transparent' }, textPosition: 'none', baselineColor: '#ccc' },
        hAxis:       { textStyle: { color: '#6B7280', fontSize: 10 }, ticks: [{ v: 0, f: 'Income' }, { v: 1, f: 'Spending' }] },
      };

      const chart = new window.google.visualization.ColumnChart(chartRef.current);
      chart.draw(data, options);
    }

    if (window.google && window.google.charts) {
      window.google.charts.setOnLoadCallback(drawChart);
    } else {
      const existing = document.getElementById('google-charts-script');
      if (existing) {
        existing.addEventListener('load', () => {
          window.google.charts.load('current', { packages: ['corechart'] });
          window.google.charts.setOnLoadCallback(drawChart);
        });
        return;
      }
      const script  = document.createElement('script');
      script.id     = 'google-charts-script';
      script.src    = 'https://www.gstatic.com/charts/loader.js';
      script.onload = () => {
        window.google.charts.load('current', { packages: ['corechart'] });
        window.google.charts.setOnLoadCallback(drawChart);
      };
      document.head.appendChild(script);
    }
  }, []);

  return (
    <div ref={chartRef} style={{ width: '160px', height: '120px' }} aria-label="Income vs Spending bar chart" />
  );
}

/* ─────────────────────────────────────────────
   Main page component
───────────────────────────────────────────── */
function AccountDetailsPage() {
  const navigate = useNavigate();

  const [routingOpen,  setRoutingOpen]  = useState(false);
  const [statusOpen,   setStatusOpen]   = useState(false);

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
            <h2 className="text-2xl font-extrabold text-gray-900 tracking-wide">JOINT</h2>
            <button type="button" className="text-[#1a6bbf] font-bold text-base tracking-wide">EDIT</button>
          </div>
          <div className="flex flex-col items-center">
            <p className="text-5xl font-bold text-gray-900 mb-2">$664.89</p>
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
                <div className="pt-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Account number</span>
                    <span className="text-sm font-medium text-gray-900">••••••7890</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Routing number</span>
                    <span className="text-sm font-medium text-gray-900">026009593</span>
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
              {transactions.map((tx, i) => (
                <div key={i}>
                  <button
                    type="button"
                    onClick={() => navigate('/transaction-details', { state: { transaction: tx } })}
                    className="w-full flex items-start justify-between py-3 text-left active:bg-gray-50"
                  >
                    <div className="flex-1 pr-4">
                      <p className="text-gray-500 text-xs font-normal mb-0.5">{tx.status}</p>
                      <p className="text-gray-900 text-sm font-bold leading-snug whitespace-pre-line">
                        {tx.description}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-[#1a6bbf]">{tx.amount}</p>
                      <p className="text-gray-500 text-xs font-normal">{tx.balance}</p>
                    </div>
                  </button>
                  {i < transactions.length - 1 && <InsetDivider color={100} />}
                </div>
              ))}
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
                <SpendingChart />
                <p className="text-gray-500 text-[10px] font-normal -mt-1">Income / Spending</p>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed">
                Nice work! On average, you spend{' '}
                <span className="text-[#1a6bbf] font-bold">$782 less</span>{' '}
                than you deposit each month. Setting a budget can help you stay on track.
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

          <button type="button" className="w-full flex items-center justify-between px-5 py-4">
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
