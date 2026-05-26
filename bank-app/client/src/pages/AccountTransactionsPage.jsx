import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import { dashboardService } from '../services/dashboardService';
import { formatBalance, toDetailPayload } from '../utils/format';

const PAGE_SIZE = 25;

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtAmt(tx) {
  const n = Number(tx.amount).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return tx.type === 'debit' ? `-$${n}` : `+$${n}`;
}

function fmtDateShort(d) {
  const dt = new Date(d);
  return `${String(dt.getMonth() + 1).padStart(2, '0')}/${String(dt.getDate()).padStart(2, '0')}`;
}

function monthGroupKey(d) {
  return new Date(d).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).toUpperCase();
}

function groupByMonth(txs) {
  const keys = [];
  const groups = {};
  for (const tx of txs) {
    const k = monthGroupKey(tx.transactionDate);
    if (!groups[k]) { groups[k] = []; keys.push(k); }
    groups[k].push(tx);
  }
  return keys.map((k) => [k, groups[k]]);
}

// Split a long ACH description string into two display lines
function splitDesc(desc) {
  if (!desc) return ['—', ''];
  const maxL1 = 34;
  if (desc.length <= maxL1) return [desc, ''];
  const splitAt = desc.lastIndexOf(' ', maxL1);
  if (splitAt > 18) return [desc.slice(0, splitAt), desc.slice(splitAt + 1)];
  return [desc.slice(0, maxL1), desc.slice(maxL1)];
}

// ── Icons ─────────────────────────────────────────────────────────────────────

const SearchIcon = () => (
  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
  </svg>
);

const XIcon = () => (
  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// ── Sub-components ────────────────────────────────────────────────────────────

function TxRow({ tx, onPress }) {
  const [line1, line2] = splitDesc(tx.description);
  const isDebit  = tx.type === 'debit';
  const isPending = tx.status === 'pending';

  return (
    <button
      type="button"
      onClick={onPress}
      className="w-full flex items-start px-4 py-3 border-b border-gray-100 last:border-0 active:bg-gray-50 text-left"
    >
      {/* Date column */}
      <div className="w-11 flex-shrink-0 pt-px">
        <p className="text-[11px] text-gray-400 font-medium leading-tight">
          {fmtDateShort(tx.transactionDate)}
        </p>
      </div>

      {/* Description column */}
      <div className="flex-1 min-w-0 px-2">
        <p className="text-[13px] font-semibold text-gray-900 leading-snug truncate">
          {line1}
        </p>
        {line2 ? (
          <p className="text-[11px] text-gray-500 leading-snug truncate mt-px">{line2}</p>
        ) : null}
        {isPending && (
          <p className="text-[10px] font-bold text-amber-600 mt-px tracking-wide">PROCESSING</p>
        )}
      </div>

      {/* Amount + running balance column */}
      <div className="flex-shrink-0 text-right pl-2">
        <p className={`text-[13px] font-bold leading-snug ${isDebit ? 'text-gray-900' : 'text-green-700'}`}>
          {fmtAmt(tx)}
        </p>
        {tx.balanceAfter != null && (
          <p className="text-[11px] text-gray-400 leading-snug mt-px">
            {formatBalance(tx.balanceAfter)}
          </p>
        )}
      </div>
    </button>
  );
}

function SkeletonRow() {
  return (
    <div className="flex items-start px-4 py-3 border-b border-gray-100 animate-pulse">
      <div className="w-11 flex-shrink-0 pt-1">
        <div className="h-2.5 bg-gray-100 rounded w-8" />
      </div>
      <div className="flex-1 px-2 space-y-1.5">
        <div className="h-3 bg-gray-100 rounded w-48" />
        <div className="h-2.5 bg-gray-100 rounded w-32" />
      </div>
      <div className="flex-shrink-0 text-right space-y-1.5">
        <div className="h-3 bg-gray-100 rounded w-16 ml-auto" />
        <div className="h-2.5 bg-gray-100 rounded w-14 ml-auto" />
      </div>
    </div>
  );
}

function MonthHeader({ label }) {
  return (
    <div className="px-4 py-2.5 bg-gray-50 border-b border-gray-200 border-t border-t-gray-200 sticky top-0 z-[1]">
      <p className="text-[11px] font-bold text-gray-500 tracking-widest">{label}</p>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

function AccountTransactionsPage() {
  const navigate   = useNavigate();
  const { state }  = useLocation();
  const account    = state?.account || null;

  const [txs,          setTxs]          = useState([]);
  const [page,         setPage]         = useState(1);
  const [hasMore,      setHasMore]      = useState(true);
  const [loading,      setLoading]      = useState(true);
  const [loadingMore,  setLoadingMore]  = useState(false);

  const [searchInput,  setSearchInput]  = useState('');
  const [search,       setSearch]       = useState('');
  const [typeFilter,   setTypeFilter]   = useState('');

  const sentinelRef = useRef(null);

  // ── Fetch a page of transactions ──────────────────────────────────
  const fetchPage = useCallback(async (pg, reset = false) => {
    if (!account?.id) return;
    try {
      const res = await dashboardService.getAccountTransactions(account.id, {
        page:   pg,
        limit:  PAGE_SIZE,
        ...(search     ? { search }     : {}),
        ...(typeFilter ? { type: typeFilter } : {}),
      });
      const newTxs   = res?.data        || [];
      const { pages = 1 } = res?.pagination || {};
      setTxs((prev) => reset ? newTxs : [...prev, ...newTxs]);
      setHasMore(pg < pages);
      setPage(pg);
    } catch {
      // keep current state on error
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [account?.id, search, typeFilter]);

  // ── Reset + fetch on filter changes ──────────────────────────────
  useEffect(() => {
    setLoading(true);
    setTxs([]);
    setPage(1);
    setHasMore(true);
    fetchPage(1, true);
  }, [search, typeFilter, fetchPage]);

  // ── Infinite scroll sentinel ──────────────────────────────────────
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !loading && !loadingMore) {
          setLoadingMore(true);
          fetchPage(page + 1);
        }
      },
      { rootMargin: '120px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, loading, loadingMore, page, fetchPage]);

  // ── Search submit ─────────────────────────────────────────────────
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setSearch(searchInput.trim());
  };

  const clearSearch = () => {
    setSearchInput('');
    setSearch('');
  };

  // ── Navigate to transaction detail ────────────────────────────────
  const handleTxPress = (tx) => {
    navigate('/transaction-details', { state: { transaction: toDetailPayload(tx) } });
  };

  // ── Group transactions by month for display ───────────────────────
  const grouped = groupByMonth(txs);

  // ── Account header title ──────────────────────────────────────────
  const accountTitle = account
    ? `${account.accountName?.toUpperCase() ?? 'ACCOUNT'} ••••${account.last4 ?? ''}`
    : 'TRANSACTIONS';

  return (
    <div className="flex flex-col min-h-screen bg-white font-sans">

      <AppHeader
        showBackButton
        title={accountTitle}
      />

      {/* ── Sticky filter bar ── */}
      <div className="fixed top-[64px] left-0 right-0 z-10 bg-white border-b border-gray-200">

        {/* Search bar */}
        <form onSubmit={handleSearchSubmit} className="px-4 pt-3 pb-2">
          <div className="flex items-center bg-gray-100 rounded-xl px-3 py-2.5 gap-2">
            <SearchIcon />
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search transactions"
              className="bg-transparent flex-1 text-sm text-gray-800 placeholder-gray-400 outline-none"
            />
            {searchInput ? (
              <button type="button" onClick={clearSearch} className="flex-shrink-0">
                <XIcon />
              </button>
            ) : null}
          </div>
        </form>

        {/* Filter chips */}
        <div className="flex gap-2 px-4 pb-3">
          {[
            { val: '',       label: 'All' },
            { val: 'debit',  label: 'Debits' },
            { val: 'credit', label: 'Credits' },
          ].map(({ val, label }) => (
            <button
              key={val}
              type="button"
              onClick={() => setTypeFilter(val)}
              className={`px-4 py-1.5 rounded-full text-[13px] font-semibold border transition-colors ${
                typeFilter === val
                  ? 'bg-[#002D72] text-white border-[#002D72]'
                  : 'bg-white text-gray-600 border-gray-300'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Scrollable transaction list ── */}
      <div className="flex-1 pt-[132px] pb-6">

        {/* Account balance summary strip */}
        {account && (
          <div className="px-4 py-3 bg-white border-b border-gray-100 flex items-center justify-between">
            <span className="text-[13px] text-gray-500 font-medium">Available balance</span>
            <span className="text-[15px] font-bold text-gray-900">
              {formatBalance(account.availableBalance)}
            </span>
          </div>
        )}

        {/* Loading skeleton */}
        {loading && (
          <div>
            {Array.from({ length: 8 }, (_, i) => <SkeletonRow key={i} />)}
          </div>
        )}

        {/* No results */}
        {!loading && txs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
            <p className="text-gray-400 text-sm font-medium">
              {search || typeFilter ? 'No transactions match your filter.' : 'No transactions found.'}
            </p>
            {(search || typeFilter) && (
              <button
                type="button"
                onClick={() => { clearSearch(); setTypeFilter(''); }}
                className="mt-3 text-[#1a6bbf] text-sm font-semibold"
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* Transaction groups */}
        {!loading && grouped.map(([monthKey, monthTxs]) => (
          <div key={monthKey}>
            <MonthHeader label={monthKey} />
            {monthTxs.map((tx, i) => (
              <TxRow
                key={tx._id || `${monthKey}-${i}`}
                tx={tx}
                onPress={() => handleTxPress(tx)}
              />
            ))}
          </div>
        ))}

        {/* Infinite scroll sentinel */}
        <div ref={sentinelRef} className="h-2" />

        {/* Loading more indicator */}
        {loadingMore && (
          <p className="text-center py-5 text-[12px] text-gray-400 font-medium tracking-wide">
            LOADING NEXT {PAGE_SIZE} TRANSACTIONS...
          </p>
        )}

        {/* End of list */}
        {!loading && !loadingMore && !hasMore && txs.length > 0 && (
          <p className="text-center py-5 text-[11px] text-gray-300 tracking-widest font-semibold uppercase">
            End of transaction history
          </p>
        )}
      </div>

    </div>
  );
}

export default AccountTransactionsPage;
