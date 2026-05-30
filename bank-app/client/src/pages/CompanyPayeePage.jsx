import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import LegalDisclosure from '../components/LegalDisclosure';
import { api } from '../services/api';
import { searchCompanies, CATEGORY_LABELS } from '../data/billPayCompanies';

// ── Step indicator ────────────────────────────────────────────────
function StepDots({ step }) {
  const steps = ['search', 'details', 'success'];
  const idx   = steps.indexOf(step);
  return (
    <div className="flex items-center justify-center gap-2 py-3">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={`rounded-full transition-all ${
            i <= idx ? 'w-3 h-3 bg-[#002D72]' : 'w-2.5 h-2.5 bg-gray-300'
          }`}
        />
      ))}
    </div>
  );
}

// ── Category badge ────────────────────────────────────────────────
function CategoryBadge({ category }) {
  return (
    <span className="text-[11px] font-medium text-gray-400 uppercase tracking-wide">
      {CATEGORY_LABELS[category] || category}
    </span>
  );
}

// ── Company result row ────────────────────────────────────────────
function CompanyRow({ company, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(company)}
      className="w-full flex items-center justify-between px-5 py-4 bg-white active:bg-gray-50 border-b border-gray-100 last:border-0 text-left"
    >
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-[#002D72]/10 flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-[#002D72]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <div>
          <p className="text-[15px] font-semibold text-gray-900">{company.name}</p>
          <CategoryBadge category={company.category} />
        </div>
      </div>
      <svg className="w-5 h-5 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
}

// ── Main page ─────────────────────────────────────────────────────
export default function CompanyPayeePage() {
  const navigate = useNavigate();

  const [step,     setStep]     = useState('search');  // search | not-found | details | success
  const [query,    setQuery]    = useState('');
  const [results,  setResults]  = useState([]);
  const [selected, setSelected] = useState(null); // company from directory, or null for manual

  // Details form
  const [accountNumber,  setAccountNumber]  = useState('');
  const [confirmAccount, setConfirmAccount] = useState('');
  const [nickname,       setNickname]       = useState('');
  const [saving,         setSaving]         = useState(false);
  const [error,          setError]          = useState('');
  const [savedPayee,     setSavedPayee]     = useState(null);

  const inputRef = useRef(null);

  // Instant search as user types
  useEffect(() => {
    const trimmed = query.trim();
    setResults(trimmed.length > 0 ? searchCompanies(trimmed) : []);
  }, [query]);

  // Focus search input on mount
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const handleCompanySelect = (company) => {
    setSelected(company);
    setNickname(company.name);
    setStep('details');
    setError('');
  };

  const handleSearch = () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    if (results.length > 0) {
      // Pick top result if exact match, else show not-found
      const exact = results.find(r => r.name.toLowerCase() === trimmed.toLowerCase());
      if (exact) {
        handleCompanySelect(exact);
      } else {
        setStep('not-found');
      }
    } else {
      setStep('not-found');
    }
  };

  const handleAddManually = () => {
    setSelected({ name: query.trim(), category: 'other', id: null });
    setNickname(query.trim());
    setStep('details');
    setError('');
  };

  const handleSave = async () => {
    if (!nickname.trim()) { setError('Nickname is required.'); return; }
    if (!accountNumber.trim()) { setError('Account number is required.'); return; }
    if (accountNumber !== confirmAccount) { setError('Account numbers do not match.'); return; }

    setSaving(true);
    setError('');
    try {
      const res = await api.post('/bill-pay/payees', {
        name:          selected?.name || query.trim(),
        nickname:      nickname.trim(),
        category:      selected?.category || 'other',
        accountNumber: accountNumber.trim(),
      });
      setSavedPayee(res.data);
      setStep('success');
    } catch (e) {
      setError(e.message || 'Failed to add payee.');
    } finally {
      setSaving(false);
    }
  };

  // ── SUCCESS screen ────────────────────────────────────────────
  if (step === 'success') {
    const displayName = savedPayee?.nickname || savedPayee?.name || selected?.name || query;
    return (
      <div className="flex flex-col h-screen bg-white font-sans">
        <AppHeader title="Success" showSpacer />
        <div className="flex-1 pt-[64px] overflow-y-auto pb-28">
          <StepDots step="success" />

          <div className="px-5 pt-4 pb-6">
            <h1 className="text-[26px] font-bold text-gray-900 mb-6">{displayName} was added.</h1>

            {/* Payee summary card */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 rounded-xl bg-[#002D72]/10 flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-[#002D72]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div>
                <p className="text-[17px] font-semibold text-gray-900">{savedPayee?.name || displayName}</p>
                <p className="text-[13px] text-gray-400">{CATEGORY_LABELS[savedPayee?.category] || 'Other'}</p>
              </div>
            </div>

            {/* Details */}
            <div className="bg-gray-50 rounded-xl divide-y divide-gray-200">
              {[
                ['Name',       savedPayee?.name || displayName],
                ['Nickname',   savedPayee?.nickname || '—'],
                ['Account',    accountNumber.replace(/.(?=.{4})/g, '•')],
              ].map(([label, value]) => (
                <div key={label} className="flex items-center justify-between px-4 py-3">
                  <span className="text-[14px] text-gray-500">{label}</span>
                  <span className="text-[14px] text-gray-900 font-medium">{value}</span>
                </div>
              ))}
            </div>
          </div>
          <LegalDisclosure />
        </div>
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 px-5 py-4">
          <button
            type="button"
            onClick={() => navigate('/bill-pay', { replace: true })}
            className="w-full py-4 bg-[#002D72] text-white font-bold text-sm tracking-widest rounded-full active:opacity-80"
          >
            DONE
          </button>
        </div>
      </div>
    );
  }

  // ── DETAILS form ──────────────────────────────────────────────
  if (step === 'details') {
    return (
      <div className="flex flex-col h-screen bg-white font-sans">
        <AppHeader showBackButton title="Add Payee" showSpacer />
        <div className="flex-1 pt-[64px] overflow-y-auto pb-28">
          <StepDots step="details" />

          <p className="px-5 pt-2 pb-4 text-[14px] text-gray-500">
            Please provide details for <span className="font-semibold text-gray-800">{selected?.name || query}</span>
          </p>

          <div className="bg-white border-t border-b border-gray-200 divide-y divide-gray-100">
            {/* Company name (read-only) */}
            <div className="flex items-center justify-between px-5 py-4">
              <p className="text-[15px] text-gray-500 flex-shrink-0">Company</p>
              <p className="text-[15px] text-[#002D72] font-medium text-right ml-4 max-w-[55%] truncate">
                {selected?.name || query}
              </p>
            </div>

            {/* Nickname */}
            <div className="flex items-center justify-between px-5 py-4">
              <p className="text-[15px] text-gray-500 flex-shrink-0">Nickname</p>
              <input
                type="text"
                value={nickname}
                onChange={e => { setNickname(e.target.value); setError(''); }}
                placeholder="Optional"
                className="text-[15px] text-[#002D72] font-medium text-right bg-transparent outline-none placeholder-gray-300 w-[55%]"
              />
            </div>

            {/* Account number */}
            <div className="flex items-center justify-between px-5 py-4">
              <p className="text-[15px] text-gray-500 flex-shrink-0 mr-4">Account Number</p>
              <input
                type="password"
                value={accountNumber}
                onChange={e => { setAccountNumber(e.target.value); setError(''); }}
                placeholder="•••••••"
                autoComplete="new-password"
                className="text-[15px] text-[#002D72] font-medium text-right bg-transparent outline-none placeholder-gray-300 w-[55%]"
              />
            </div>

            {/* Confirm account number */}
            <div className="flex items-center justify-between px-5 py-4">
              <p className="text-[15px] text-gray-500 flex-shrink-0 mr-4">Confirm Account</p>
              <input
                type="password"
                value={confirmAccount}
                onChange={e => { setConfirmAccount(e.target.value); setError(''); }}
                placeholder="•••••••"
                autoComplete="new-password"
                className="text-[15px] text-[#002D72] font-medium text-right bg-transparent outline-none placeholder-gray-300 w-[55%]"
              />
            </div>
          </div>

          {error && (
            <p className="mx-5 mt-4 text-sm text-red-500 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              {error}
            </p>
          )}

          <LegalDisclosure />
        </div>

        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 px-5 py-4">
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => { setStep('search'); setError(''); }}
              className="flex-1 py-4 bg-white border-2 border-[#002D72] text-[#002D72] font-bold text-sm tracking-widest rounded-full"
            >
              CANCEL
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !accountNumber || !nickname}
              className="flex-1 py-4 bg-[#002D72] text-white font-bold text-sm tracking-widest rounded-full disabled:opacity-40"
            >
              {saving ? 'SAVING…' : 'SAVE'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── NOT-FOUND screen ──────────────────────────────────────────
  if (step === 'not-found') {
    return (
      <div className="flex flex-col h-screen bg-white font-sans">
        <AppHeader showBackButton title="Company Search" showSpacer />
        <div className="flex-1 pt-[64px] overflow-y-auto pb-28">
          <StepDots step="search" />

          <p className="px-5 pt-4 pb-6 text-[15px] text-gray-700 leading-snug">
            We were unable to find a match for{' '}
            <span className="font-semibold">"{query}"</span>.
            Please select what you'd like to do now.
          </p>

          <div className="bg-white border-t border-b border-gray-200 divide-y divide-gray-100">
            <button
              type="button"
              onClick={handleAddManually}
              className="w-full flex items-center justify-between px-5 py-5 active:bg-gray-50"
            >
              <span className="text-[15px] text-[#1a6bbf] font-medium text-left leading-snug">
                Add "<span className="font-semibold">{query}</span>" to Your List
              </span>
              <svg className="w-5 h-5 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => { setQuery(''); setResults([]); setStep('search'); }}
              className="w-full flex items-center justify-between px-5 py-5 active:bg-gray-50"
            >
              <span className="text-[15px] text-[#1a6bbf] font-medium">Search Again</span>
              <svg className="w-5 h-5 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <LegalDisclosure />
        </div>

        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 px-5 py-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-full py-4 bg-white border-2 border-[#002D72] text-[#002D72] font-bold text-sm tracking-widest rounded-full"
          >
            CANCEL
          </button>
        </div>
      </div>
    );
  }

  // ── SEARCH screen (default) ───────────────────────────────────
  return (
    <div className="flex flex-col h-screen bg-white font-sans">
      <AppHeader showBackButton title="Company" showSpacer />

      <div className="flex-1 pt-[64px] overflow-y-auto pb-24">
        <p className="px-5 pt-5 pb-3 text-[15px] text-gray-700 font-medium leading-snug">
          Enter a company name to search our list of major businesses.
        </p>

        {/* Search input with clear button */}
        <div className="px-5 pb-4">
          <div className="flex items-center bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 gap-2">
            <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M21 21l-4.35-4.35m0 0A7.5 7.5 0 104.5 4.5a7.5 7.5 0 0012.15 12.15z" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Search company name…"
              autoComplete="off"
              className="flex-1 text-[15px] text-gray-900 bg-transparent outline-none placeholder-gray-400"
            />
            {query.length > 0 && (
              <button
                type="button"
                onClick={() => { setQuery(''); setResults([]); }}
                className="text-gray-400 text-lg leading-none px-1"
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* Instant results */}
        {results.length > 0 && (
          <div className="border-t border-b border-gray-200">
            {results.map(company => (
              <CompanyRow key={company.id} company={company} onSelect={handleCompanySelect} />
            ))}
          </div>
        )}

        {/* Empty state hint */}
        {query.length > 0 && results.length === 0 && (
          <p className="px-5 py-4 text-[14px] text-gray-400">
            No companies found for "{query}". Try a different search term.
          </p>
        )}

        <LegalDisclosure />
      </div>

      {/* Action bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 px-5 py-4">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 py-4 bg-white border-2 border-[#002D72] text-[#002D72] font-bold text-sm tracking-widest rounded-full"
          >
            CANCEL
          </button>
          <button
            type="button"
            onClick={handleSearch}
            disabled={query.trim().length === 0}
            className="flex-1 py-4 bg-[#002D72] text-white font-bold text-sm tracking-widest rounded-full disabled:opacity-40"
          >
            SEARCH
          </button>
        </div>
      </div>
    </div>
  );
}
