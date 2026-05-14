import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import LegalDisclosure from '../components/LegalDisclosure';
import InsetDivider from '../components/InsetDivider';
import imgPaperless from '../assets/images/paperless-settings-icon.png';

// ── Mock data (replace with API calls) ──────────────────────────
const ACCOUNTS = [
  { id: 'all',      label: 'All Accounts' },
  { id: 'joint',    label: 'joint' },
  { id: 'adv-3580', label: 'Adv SafeBalance Banking - 3580' },
];

const YEARS = [2026, 2025, 2024, 2023, 2022, 2021, 2020, 2019];

const ALL_STATEMENTS = [
  {
    id: 1,
    title: 'April Statement',
    account: 'Adv SafeB... - 3580',
    accountId: 'adv-3580',
    date: 'Apr 23, 2026',
    year: 2026,
    borderColor: '#1a6bbf',
  },
  {
    id: 2,
    title: 'April Statement',
    account: 'joint',
    accountId: 'joint',
    date: 'Apr 22, 2026',
    year: 2026,
    borderColor: '#1a6bbf',
  },
  {
    id: 3,
    title: 'Hold/freeze $7300.00',
    account: 'Adv SafeB... - 3580',
    accountId: 'adv-3580',
    date: 'Apr 20, 2026',
    year: 2026,
    borderColor: '#F59E0B',
  },
];

const ACCORDION_SECTIONS = [
  { id: 'statements',    label: 'Statements',                    dotColor: '#1a6bbf' },
  { id: 'tax',           label: 'Tax Statements (Download only)', dotColor: '#BE185D' },
  { id: 'notifications', label: 'Notifications and Letters',      dotColor: '#D97706' },
  { id: 'other',         label: 'Other Account Documents',        dotColor: '#9CA3AF' },
];

// ── Sub-components ───────────────────────────────────────────────

const IconChevronDown = () => (
  <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

function FilterButton({ label, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-1 text-[#1a6bbf] font-bold text-base"
    >
      {label}
      <svg className="w-3 h-3 fill-[#1a6bbf]" viewBox="0 0 10 6">
        <path d="M0 0l5 6 5-6z" />
      </svg>
    </button>
  );
}

function RadioOption({ label, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full flex items-center justify-between px-5 py-4 text-left active:bg-gray-50"
    >
      <span className="text-base font-bold text-[#1a6bbf]">{label}</span>
      <div className="w-5 h-5 rounded-full border-2 border-[#1a6bbf] flex items-center justify-center flex-shrink-0">
        {selected && <div className="w-3 h-3 rounded-full bg-[#1a6bbf]" />}
      </div>
    </button>
  );
}

function StatementCard({ statement }) {
  return (
    <div className="flex-shrink-0 w-40 bg-white border border-gray-200 overflow-hidden rounded-sm">
      <div className="h-[3px] w-full" style={{ backgroundColor: statement.borderColor }} />
      <div className="px-3 pt-3 pb-5">
        <p className="text-sm font-semibold text-gray-900 leading-snug mb-5">
          {statement.title}
        </p>
        <p className="text-xs text-gray-500 leading-snug">{statement.account}</p>
        <p className="text-xs text-gray-400 mt-1">{statement.date}</p>
      </div>
    </div>
  );
}

function AccordionSection({ section, isExpanded, onToggle }) {
  return (
    <div>
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-5 text-left active:bg-gray-50"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-3 h-3 rounded-full flex-shrink-0"
            style={{ backgroundColor: section.dotColor }}
          />
          <span className="text-base text-gray-900">{section.label}</span>
        </div>
        <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
          <IconChevronDown />
        </div>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-40' : 'max-h-0'}`}
      >
        <div className="px-5 pb-5">
          <p className="text-sm text-gray-400">No documents available for this period.</p>
        </div>
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────

function StatementsAndDocumentsPage() {
  const navigate = useNavigate();
  const [selectedAccount, setSelectedAccount] = useState('all');
  const [selectedYear, setSelectedYear]       = useState(2026);
  const [accountOpen, setAccountOpen]         = useState(false);
  const [yearOpen, setYearOpen]               = useState(false);
  const [expandedSections, setExpandedSections] = useState({});

  const filterRef = useRef(null);

  // Close dropdowns when clicking outside
  useEffect(() => {
    function onDocClick(e) {
      if (filterRef.current && !filterRef.current.contains(e.target)) {
        setAccountOpen(false);
        setYearOpen(false);
      }
    }
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const toggleSection = (id) =>
    setExpandedSections(prev => ({ ...prev, [id]: !prev[id] }));

  const filteredStatements = ALL_STATEMENTS.filter(s => {
    const byAccount = selectedAccount === 'all' || s.accountId === selectedAccount;
    const byYear    = s.year === selectedYear;
    return byAccount && byYear;
  });

  const accountLabel = ACCOUNTS.find(a => a.id === selectedAccount)?.label ?? 'All Accounts';

  return (
    <div className="flex flex-col h-screen bg-gray-100 font-sans">

      <AppHeader showBackButton title="Statements &..." showCartAndErica />

      {/* Everything below the fixed header */}
      <div className="flex flex-col flex-1 pt-[64px] overflow-hidden">

        {/* ── Sticky sub-header ── */}
        <div ref={filterRef} className="bg-white flex-shrink-0 relative z-40 shadow-sm">

          {/* "Provided by Bank of America" */}
          <div className="px-4 pt-2 pb-0">
            <p className="text-xs text-gray-500 text-right">Provided by Bank of America</p>
          </div>

          {/* Filter row */}
          <div className="flex items-center justify-between px-4 py-3">
            <FilterButton
              label={accountLabel}
              onClick={() => { setAccountOpen(p => !p); setYearOpen(false); }}
            />
            <FilterButton
              label={String(selectedYear)}
              onClick={() => { setYearOpen(p => !p); setAccountOpen(false); }}
            />
          </div>

          <div className="border-b border-gray-200" />

          {/* Account dropdown */}
          {accountOpen && (
            <div className="absolute top-full left-0 w-[72%] bg-white shadow-lg z-50 border-r border-b border-gray-200">
              {ACCOUNTS.map((acc, i) => (
                <React.Fragment key={acc.id}>
                  <RadioOption
                    label={acc.label}
                    selected={selectedAccount === acc.id}
                    onSelect={() => { setSelectedAccount(acc.id); setAccountOpen(false); }}
                  />
                  {i < ACCOUNTS.length - 1 && <div className="border-b border-gray-100 mx-5" />}
                </React.Fragment>
              ))}
            </div>
          )}

          {/* Year dropdown */}
          {yearOpen && (
            <div className="absolute top-full right-0 w-44 bg-white shadow-lg z-50 border-l border-b border-gray-200">
              {YEARS.map((year, i) => (
                <React.Fragment key={year}>
                  <RadioOption
                    label={String(year)}
                    selected={selectedYear === year}
                    onSelect={() => { setSelectedYear(year); setYearOpen(false); }}
                  />
                  {i < YEARS.length - 1 && <div className="border-b border-gray-100 mx-5" />}
                </React.Fragment>
              ))}
            </div>
          )}
        </div>

        {/* ── Scrollable content ── */}
        <div className="flex-1 overflow-y-auto pb-8">

          {/* Most Recent + cards + View All */}
          <div className="bg-white mt-3">
            <p className="px-4 pt-5 pb-4 text-xs text-gray-400 uppercase tracking-widest font-semibold">
              Most Recent
            </p>

            {/* Horizontal scroll */}
            <div
              className="flex gap-3 px-4 overflow-x-auto pb-1"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {filteredStatements.length > 0
                ? filteredStatements.map(s => <StatementCard key={s.id} statement={s} />)
                : <p className="text-sm text-gray-400 py-2">No statements found.</p>
              }
            </div>

            {/* VIEW ALL */}
            <div className="px-4 py-4 mt-2">
              <button type="button" className="text-xs text-gray-400 uppercase tracking-widest font-semibold">
                View All
              </button>
            </div>

            <div className="border-b border-gray-200" />

            {/* Accordion sections */}
            {ACCORDION_SECTIONS.map((section, i) => (
              <React.Fragment key={section.id}>
                <AccordionSection
                  section={section}
                  isExpanded={!!expandedSections[section.id]}
                  onToggle={() => toggleSection(section.id)}
                />
                {i < ACCORDION_SECTIONS.length - 1 && <InsetDivider color={200} />}
              </React.Fragment>
            ))}
          </div>

          {/* Manage Paperless Settings */}
          <div className="bg-white mt-3">
            <button
              type="button"
              onClick={() => navigate('/go-paperless')}
              className="w-full flex items-center gap-4 px-5 py-5 text-left active:bg-gray-50"
            >
              <img src={imgPaperless} alt="Paperless" className="w-10 h-10 object-contain flex-shrink-0" />
              <div>
                <p className="text-base font-bold text-gray-900">Manage your Paperless Settings</p>
                <p className="text-sm text-gray-500 mt-0.5">Get safe, secure statements right in the app</p>
              </div>
            </button>
          </div>

          {/* Info paragraphs */}
          <div className="mt-3 px-4 pt-4 pb-2">
            <p className="text-sm text-gray-500 leading-relaxed mb-4">
              Please visit Online Banking to request older statements.
            </p>
            <p className="text-sm text-gray-500 leading-relaxed mb-4">
              Please consider the privacy and security settings of your device or third party applications before opening, forwarding or downloading your statements, they are outside of the bank&#39;s secure mobile application.
            </p>
            <p className="text-sm text-gray-500 leading-relaxed">
              To locate a tax form, first search in current year, and then search in earlier years until you&#39;ve located it. Tax statements can only be downloaded because they contain your Tax Identification Number (TIN), Social Security Number (SSN) and/or full account number. Looking for your Tax Documents and don&#39;t see them? Ask Erica for &#8220;Tax Statements&#8221;.
            </p>
          </div>

          <LegalDisclosure />
        </div>

      </div>
    </div>
  );
}

export default StatementsAndDocumentsPage;
