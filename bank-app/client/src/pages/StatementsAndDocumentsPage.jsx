import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import LegalDisclosure from '../components/LegalDisclosure';
import InsetDivider from '../components/InsetDivider';
import imgPaperless from '../assets/images/paperless-settings-icon.png';
import { accountService } from '../services/accountService';

const ACCORDION_SECTIONS = [
  { id: 'statements',    label: 'Statements',                    dotColor: '#1a6bbf' },
  { id: 'tax',           label: 'Tax Statements (Download only)', dotColor: '#BE185D' },
  { id: 'notifications', label: 'Notifications and Letters',      dotColor: '#D97706' },
  { id: 'other',         label: 'Other Account Documents',        dotColor: '#9CA3AF' },
];

// Build last N months as { period: 'YYYY-MM', label: 'Month YYYY' }
function buildPeriods(count = 24) {
  const periods = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    periods.push({
      period: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label:  d.toLocaleString('en-US', { month: 'long', year: 'numeric' }),
      year:   d.getFullYear(),
    });
  }
  return periods;
}

const ALL_PERIODS = buildPeriods(24);
const YEARS = [...new Set(ALL_PERIODS.map(p => p.year))];

const IconChevronDown = () => (
  <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
  </svg>
);

function FilterButton({ label, onClick }) {
  return (
    <button type="button" onClick={onClick}
      className="flex items-center gap-1 text-[#1a6bbf] font-bold text-base">
      {label}
      <svg className="w-3 h-3 fill-[#1a6bbf]" viewBox="0 0 10 6"><path d="M0 0l5 6 5-6z" /></svg>
    </button>
  );
}

function RadioOption({ label, selected, onSelect }) {
  return (
    <button type="button" onClick={onSelect}
      className="w-full flex items-center justify-between px-5 py-4 text-left active:bg-gray-50">
      <span className="text-base font-bold text-[#1a6bbf]">{label}</span>
      <div className="w-5 h-5 rounded-full border-2 border-[#1a6bbf] flex items-center justify-center flex-shrink-0">
        {selected && <div className="w-3 h-3 rounded-full bg-[#1a6bbf]" />}
      </div>
    </button>
  );
}

function StatementCard({ period, account, onDownload, downloading }) {
  return (
    <div className="flex-shrink-0 w-40 bg-white border border-gray-200 overflow-hidden rounded-sm">
      <div className="h-[3px] w-full bg-[#1a6bbf]" />
      <div className="px-3 pt-3 pb-4">
        <p className="text-sm font-semibold text-gray-900 leading-snug mb-3">{period.label}</p>
        <p className="text-xs text-gray-500 leading-snug truncate">
          {account ? `${account.accountName} ••••${account.last4}` : '—'}
        </p>
        <button
          type="button"
          onClick={onDownload}
          disabled={downloading}
          className="mt-3 text-xs font-semibold text-[#1a6bbf] active:opacity-70"
        >
          {downloading ? 'Downloading…' : 'Download PDF'}
        </button>
      </div>
    </div>
  );
}

function AccordionSection({ section, isExpanded, onToggle, children }) {
  return (
    <div>
      <button type="button" onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-5 text-left active:bg-gray-50">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: section.dotColor }} />
          <span className="text-base text-gray-900">{section.label}</span>
        </div>
        <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
          <IconChevronDown />
        </div>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-96' : 'max-h-0'}`}>
        <div className="px-5 pb-5">{children}</div>
      </div>
    </div>
  );
}

function StatementsAndDocumentsPage() {
  const navigate = useNavigate();
  const [accounts,      setAccounts]      = useState([]);
  const [selectedAccId, setSelectedAccId] = useState('all');
  const [selectedYear,  setSelectedYear]  = useState(YEARS[0]);
  const [accountOpen,   setAccountOpen]   = useState(false);
  const [yearOpen,      setYearOpen]      = useState(false);
  const [expandedSections, setExpandedSections] = useState({});
  const [downloading,   setDownloading]   = useState({});
  const [loadingAccts,  setLoadingAccts]  = useState(true);

  const filterRef = useRef(null);

  useEffect(() => {
    accountService.getAccounts()
      .then(res => setAccounts(res?.data || []))
      .catch(() => {})
      .finally(() => setLoadingAccts(false));
  }, []);

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

  const selectedAccount = selectedAccId === 'all' ? null : accounts.find(a => a._id === selectedAccId || a.id === selectedAccId);
  const accountLabel    = selectedAccId === 'all'
    ? 'All Accounts'
    : selectedAccount
      ? `${selectedAccount.accountName} ••••${selectedAccount.last4}`
      : 'All Accounts';

  // Periods for the selected year
  const yearPeriods = ALL_PERIODS.filter(p => p.year === selectedYear);
  // Most recent 3
  const recentPeriods = yearPeriods.slice(0, 3);

  const handleDownload = async (accountId, period) => {
    const key = `${accountId}-${period}`;
    setDownloading(prev => ({ ...prev, [key]: true }));
    try {
      await accountService.downloadStatementPDF(accountId, period);
    } catch {
      // silently fail in demo
    } finally {
      setDownloading(prev => ({ ...prev, [key]: false }));
    }
  };

  // Accounts to show statements for
  const targetAccounts = selectedAccId === 'all'
    ? accounts
    : accounts.filter(a => (a._id || a.id) === selectedAccId);

  // Build cards: cross product of targetAccounts × recentPeriods (max 6)
  const cards = [];
  for (const acc of targetAccounts) {
    for (const period of recentPeriods) {
      cards.push({ acc, period });
      if (cards.length >= 6) break;
    }
    if (cards.length >= 6) break;
  }

  const accountOptions = [
    { id: 'all', label: 'All Accounts' },
    ...accounts.map(a => ({ id: a._id || a.id, label: `${a.accountName} ••••${a.last4}` })),
  ];

  return (
    <div className="flex flex-col h-screen bg-gray-100 font-sans">
      <AppHeader showBackButton title="Statements &..." showCartAndErica />

      <div className="flex flex-col flex-1 pt-[64px] overflow-hidden">

        {/* ── Sticky sub-header ── */}
        <div ref={filterRef} className="bg-white flex-shrink-0 relative z-40 shadow-sm">
          <div className="px-4 pt-2 pb-0">
            <p className="text-xs text-gray-500 text-right">Provided by Bank of Molten</p>
          </div>
          <div className="flex items-center justify-between px-4 py-3">
            <FilterButton
              label={accountLabel.length > 22 ? accountLabel.slice(0, 22) + '…' : accountLabel}
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
            <div className="absolute top-full left-0 w-[75%] bg-white shadow-lg z-50 border-r border-b border-gray-200 max-h-64 overflow-y-auto">
              {accountOptions.map((acc, i) => (
                <React.Fragment key={acc.id}>
                  <RadioOption
                    label={acc.label}
                    selected={selectedAccId === acc.id}
                    onSelect={() => { setSelectedAccId(acc.id); setAccountOpen(false); }}
                  />
                  {i < accountOptions.length - 1 && <div className="border-b border-gray-100 mx-5" />}
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
          <div className="bg-white mt-3">
            <p className="px-4 pt-5 pb-4 text-xs text-gray-400 uppercase tracking-widest font-semibold">
              Most Recent
            </p>

            <div className="flex gap-3 px-4 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
              {loadingAccts ? (
                [1, 2, 3].map(n => (
                  <div key={n} className="flex-shrink-0 w-40 h-28 bg-gray-100 rounded-sm animate-pulse" />
                ))
              ) : cards.length === 0 ? (
                <p className="text-sm text-gray-400 py-2">No accounts found.</p>
              ) : (
                cards.map(({ acc, period }) => {
                  const accId = acc._id || acc.id;
                  const key   = `${accId}-${period.period}`;
                  return (
                    <StatementCard
                      key={key}
                      period={period}
                      account={acc}
                      downloading={!!downloading[key]}
                      onDownload={() => handleDownload(accId, period.period)}
                    />
                  );
                })
              )}
            </div>

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
                >
                  {section.id === 'statements' && targetAccounts.length > 0 ? (
                    <div className="space-y-2">
                      {yearPeriods.map(p => (
                        <div key={p.period} className="flex items-center justify-between py-1">
                          <span className="text-sm text-gray-700">{p.label}</span>
                          <div className="flex gap-3">
                            {targetAccounts.map(acc => {
                              const accId = acc._id || acc.id;
                              const key   = `${accId}-${p.period}`;
                              return (
                                <button
                                  key={accId}
                                  type="button"
                                  disabled={!!downloading[key]}
                                  onClick={() => handleDownload(accId, p.period)}
                                  className="text-xs font-semibold text-[#1a6bbf]"
                                >
                                  {downloading[key] ? '…' : `••••${acc.last4}`}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">No documents available for this period.</p>
                  )}
                </AccordionSection>
                {i < ACCORDION_SECTIONS.length - 1 && <InsetDivider color={200} />}
              </React.Fragment>
            ))}
          </div>

          {/* Manage Paperless Settings */}
          <div className="bg-white mt-3">
            <button type="button" onClick={() => navigate('/go-paperless')}
              className="w-full flex items-center gap-4 px-5 py-5 text-left active:bg-gray-50">
              <img src={imgPaperless} alt="Paperless" className="w-10 h-10 object-contain flex-shrink-0" />
              <div>
                <p className="text-base font-bold text-gray-900">Manage your Paperless Settings</p>
                <p className="text-sm text-gray-500 mt-0.5">Get safe, secure statements right in the app</p>
              </div>
            </button>
          </div>

          <div className="mt-3 px-4 pt-4 pb-2">
            <p className="text-sm text-gray-500 leading-relaxed mb-4">
              Please visit Online Banking to request older statements.
            </p>
            <p className="text-sm text-gray-500 leading-relaxed mb-4">
              Please consider the privacy and security settings of your device or third party applications before opening, forwarding or downloading your statements, they are outside of the bank&#39;s secure mobile application.
            </p>
            <p className="text-sm text-gray-500 leading-relaxed">
              To locate a tax form, first search in current year, and then search in earlier years until you&#39;ve located it.
            </p>
          </div>

          <LegalDisclosure />
        </div>
      </div>
    </div>
  );
}

export default StatementsAndDocumentsPage;
