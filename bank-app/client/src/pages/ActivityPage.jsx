import React, { useState, useEffect, useMemo, useRef } from 'react';
import LegalDisclosure from '../components/LegalDisclosure';
import InsetDivider from '../components/InsetDivider';
import AppHeader from '../components/AppHeader';
import ActivityDetailsPage from './ActivityDetailsPage';
import imgBoaMini from '../assets/images/boa-mini-logo.png';
import { Lightbulb } from 'lucide-react';
import { useDashboardStore } from '../store/dashboardStore';
import { dashboardService } from '../services/dashboardService';
import { api } from '../services/api';
import { toActivityDetailPayload } from '../utils/format';
import { onNewNotification } from '../socket/notificationSocket';

const fmtDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const fmtUSD  = (n) => '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const IconSort = () => (
  <svg className="w-4 h-4 inline-block ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4M17 8v12m0 0l4-4m-4 4l-4-4" />
  </svg>
);
const IconFilter = () => (
  <svg className="w-4 h-4 inline-block ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4h18M6 12h12M10 20h4" />
  </svg>
);

function FilterChip({ label, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-colors ${
        active
          ? 'bg-[#1a6bbf] text-white border-[#1a6bbf]'
          : 'bg-white text-gray-700 border-gray-300 active:bg-gray-50'
      }`}
    >
      {label}
    </button>
  );
}

function ActivityPage() {
  const [selectedTx, setSelectedTx] = useState(null);

  // Local transaction state — fresh fetch each mount, full control for filtering
  const [allTxs,     setAllTxs]     = useState([]);
  const [loadingTxs, setLoadingTxs] = useState(false);
  const [txError,    setTxError]    = useState(null);

  // Filter / sort state
  const [filterOpen,      setFilterOpen]      = useState(false);
  const [filterAccountId, setFilterAccountId] = useState(null);
  const [filterType,      setFilterType]      = useState('all'); // 'all' | 'debit' | 'credit'
  const [sortAsc,         setSortAsc]         = useState(false); // false = newest first

  // Search state — debounced 400ms before hitting the API
  const [searchInput,  setSearchInput]  = useState('');
  const [searchQuery,  setSearchQuery]  = useState('');
  const debounceTimer = useRef(null);

  const { accounts, fetchAccounts } = useDashboardStore();

  // Scheduled (upcoming bill payments)
  const [scheduled,        setScheduled]        = useState([]);
  const [loadingScheduled, setLoadingScheduled] = useState(true);

  useEffect(() => {
    fetchAccounts();
    api.get('/bill-pay/payments/upcoming')
      .then(res => setScheduled(res?.data || []))
      .catch(() => setScheduled([]))
      .finally(() => setLoadingScheduled(false));
  }, [fetchAccounts]);

  // Re-fetch transaction list when a transfer notification arrives (incoming cross-user transfer)
  useEffect(() => {
    return onNewNotification((n) => {
      if (n.category === 'transfer') {
        setLoadingTxs(true);
        const params = { limit: 100 };
        if (filterAccountId) params.accountId = filterAccountId;
        if (searchQuery)     params.search     = searchQuery;
        dashboardService
          .getTransactions(params)
          .then((res) => setAllTxs(res?.data || []))
          .catch(() => {})
          .finally(() => setLoadingTxs(false));
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterAccountId, searchQuery]);

  // Debounce search input → searchQuery (400ms)
  useEffect(() => {
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setSearchQuery(searchInput.trim());
    }, 400);
    return () => clearTimeout(debounceTimer.current);
  }, [searchInput]);

  // Re-fetch transactions whenever account filter or debounced search changes
  useEffect(() => {
    setLoadingTxs(true);
    setTxError(null);
    const params = { limit: 100 };
    if (filterAccountId) params.accountId = filterAccountId;
    if (searchQuery)     params.search     = searchQuery;
    dashboardService
      .getTransactions(params)
      .then((res) => setAllTxs(res?.data || []))
      .catch((err) => setTxError(err.message))
      .finally(() => setLoadingTxs(false));
  }, [filterAccountId, searchQuery]);

  // Client-side type filter + sort
  const filtered = useMemo(() => {
    let list = allTxs;
    if (filterType !== 'all') {
      list = list.filter((tx) => tx.type === filterType);
    }
    return [...list].sort((a, b) => {
      const diff = new Date(a.transactionDate) - new Date(b.transactionDate);
      return sortAsc ? diff : -diff;
    });
  }, [allTxs, filterType, sortAsc]);

  const hasActiveFilters = filterAccountId !== null || filterType !== 'all' || searchQuery !== '';

  return (
    <div className="flex flex-col h-screen bg-gray-100 font-sans">

      <AppHeader showBackButton title="Activity" showEricaRight ericaRightCount={3} />

      {/* ══════════════════════════════════
          SCROLLABLE BODY
      ══════════════════════════════════ */}
      <div className="flex-1 overflow-y-auto pt-[64px] pb-6">

        {/* ── Info card ── */}
        <div className="mx-4 mt-4 mb-6 bg-white rounded-2xl shadow-sm px-4 py-4 flex items-start gap-3">
          <Lightbulb className="w-6 h-6 text-gray-500 flex-shrink-0" strokeWidth={1.5} />
          <div>
            <p className="text-gray-900 font-semibold text-sm leading-snug">
              Can&#39;t find what you&#39;re looking for?
            </p>
            <p className="text-gray-500 text-sm leading-snug mt-0.5">
              Go to your account details to view more activity.
            </p>
          </div>
        </div>

        {/* ── Scheduled section ── */}
        <div className="px-4 mb-1">
          <h2 className="font-extrabold text-2xl text-gray-900 mb-3">Scheduled</h2>
          {loadingScheduled ? (
            <div className="space-y-2 mb-4">
              {[1, 2].map(n => <div key={n} className="h-4 bg-gray-200 rounded animate-pulse w-48" />)}
            </div>
          ) : scheduled.length === 0 ? (
            <p className="text-gray-700 text-base mb-4">There&#39;s nothing scheduled right now.</p>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-4">
              <ul className="divide-y divide-gray-100">
                {scheduled.map(pmt => (
                  <li key={pmt._id} className="flex items-center justify-between px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {pmt.payee?.nickname || pmt.payee?.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        {fmtDate(pmt.scheduledDate)}
                        {pmt.isRecurring ? ` · ${pmt.recurringRule}` : ''}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-gray-700">{fmtUSD(pmt.amount)}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <InsetDivider className="mb-4" />

        {/* ── History section ── */}
        <div className="px-4 mb-3">
          <h2 className="font-extrabold text-2xl text-gray-900 mb-4">History</h2>

          {/* Search input */}
          <div className="relative mb-4">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none"
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
            </svg>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search transactions…"
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-gray-400"
            />
            {searchInput && (
              <button
                type="button"
                onClick={() => setSearchInput('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 active:text-gray-600"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={() => setSortAsc((v) => !v)}
            className="flex items-center text-[#1a6bbf] font-bold text-base mb-3"
          >
            Sort: Date ({sortAsc ? 'Oldest' : 'Newest'}) <IconSort />
          </button>

          <button
            type="button"
            onClick={() => setFilterOpen((v) => !v)}
            className="flex items-center text-[#1a6bbf] font-bold text-base mb-2"
          >
            Filter
            {hasActiveFilters && (
              <span className="ml-1.5 w-2 h-2 bg-[#1a6bbf] rounded-full inline-block align-middle" />
            )}
            <IconFilter />
          </button>

          {/* ── Inline filter panel ── */}
          {filterOpen && (
            <div className="bg-white rounded-xl border border-gray-200 px-4 py-4 mb-3 space-y-4">
              {/* Account filter */}
              <div>
                <p className="text-gray-500 text-xs font-semibold mb-2 uppercase tracking-wider">Account</p>
                <div className="flex flex-wrap gap-2">
                  <FilterChip
                    label="All Accounts"
                    active={filterAccountId === null}
                    onClick={() => setFilterAccountId(null)}
                  />
                  {accounts.map((acc) => (
                    <FilterChip
                      key={acc.id}
                      label={`${acc.accountName} ${acc.maskedAccountNumber}`}
                      active={filterAccountId === acc.id}
                      onClick={() => setFilterAccountId(acc.id)}
                    />
                  ))}
                </div>
              </div>

              {/* Type filter */}
              <div>
                <p className="text-gray-500 text-xs font-semibold mb-2 uppercase tracking-wider">Type</p>
                <div className="flex gap-2">
                  {[['all', 'All'], ['debit', 'Debits'], ['credit', 'Credits']].map(([val, label]) => (
                    <FilterChip
                      key={val}
                      label={label}
                      active={filterType === val}
                      onClick={() => setFilterType(val)}
                    />
                  ))}
                </div>
              </div>

              {/* Clear filters */}
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={() => { setFilterAccountId(null); setFilterType('all'); setSearchInput(''); }}
                  className="text-xs text-gray-400 underline"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}

          <p className="text-gray-500 text-sm mb-3">
            {hasActiveFilters
              ? `${filtered.length} result${filtered.length !== 1 ? 's' : ''}`
              : 'Last 3 months'}
          </p>
        </div>

        {/* ── Transaction rows ── */}
        <div className="bg-white mx-0">
          {loadingTxs ? (
            [1, 2, 3].map((n) => (
              <div key={n} className="flex items-center gap-3 px-4 py-4 animate-pulse">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex-shrink-0" />
                <div className="flex-1">
                  <div className="h-3 bg-gray-100 rounded w-40 mb-2" />
                  <div className="h-2.5 bg-gray-100 rounded w-24" />
                </div>
              </div>
            ))
          ) : txError ? (
            <p className="text-red-400 text-sm px-4 py-6 text-center">{txError}</p>
          ) : filtered.length === 0 ? (
            <p className="text-gray-400 text-sm px-4 py-6 text-center">
              {hasActiveFilters ? 'No transactions match your filters.' : 'No transactions found.'}
            </p>
          ) : (
            filtered.map((tx, i) => {
              const mapped = toActivityDetailPayload(tx);
              return (
                <React.Fragment key={tx.id || i}>
                  <button
                    type="button"
                    onClick={() => setSelectedTx(mapped)}
                    className="w-full flex items-center justify-between px-4 py-4 text-left active:bg-gray-50"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden border border-gray-200">
                        <img src={imgBoaMini} alt="Bank of Molten" className="w-8 h-8 object-contain" />
                      </div>
                      <p className="text-gray-900 font-medium text-sm leading-snug">{mapped.name}</p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-4">
                      <p className="text-gray-500 text-xs mb-0.5">{mapped.date}</p>
                      <p className="text-[#1a6bbf] font-bold text-base">{mapped.amount}</p>
                      <p className="text-gray-400 text-xs">{mapped.status}</p>
                    </div>
                  </button>
                  {i < filtered.length - 1 && <InsetDivider color={200} />}
                </React.Fragment>
              );
            })
          )}
        </div>

        {/* ── Footer note ── */}
        <InsetDivider color={200} />
        <div className="px-4 py-4">
          <p className="text-gray-500 text-sm text-center">
            You&#39;re viewing all available results.{' '}
            <button
              type="button"
              onClick={() => setFilterOpen(true)}
              className="text-[#1a6bbf] font-medium"
            >
              Adjust your filters
            </button>
          </p>
        </div>

        {/* ── Legal & footer ── */}
        <LegalDisclosure />
      </div>

      {/* ── Transaction detail modal ── */}
      <ActivityDetailsPage
        transaction={selectedTx}
        onClose={() => setSelectedTx(null)}
        rounded={false}
      />
    </div>
  );
}

export default ActivityPage;
