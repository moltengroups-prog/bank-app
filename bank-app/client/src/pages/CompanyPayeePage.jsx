import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import LegalDisclosure from '../components/LegalDisclosure';

function CompanyPayeePage() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const canSearch = query.trim().length > 0;

  const handleSearch = () => {
    if (!canSearch) return;
    // future: navigate('/company-payee-results', { state: { query } })
    console.log('Searching for company:', query);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 font-sans">

      <AppHeader showBackButton title="Company" showSpacer />

      {/* Scrollable body — pb-24 clears the fixed button bar */}
      <div className="flex-1 pt-[64px] overflow-y-auto pb-24">

        {/* Instruction text */}
        <p className="px-4 pt-5 pb-5 text-base font-bold text-gray-800 leading-snug">
          Enter a company name to search our list of major businesses.
        </p>

        {/* Search input */}
        <div className="px-4 pb-6">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Enter Company Name"
            autoComplete="off"
            className="w-full bg-white border border-gray-300 rounded-xl px-4 py-4 text-base text-gray-900 placeholder-gray-400 outline-none focus:border-gray-400"
          />
        </div>

        <LegalDisclosure />
      </div>

      {/* ── Sticky bottom action bar ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-gray-100 border-t border-gray-200 px-4 py-3">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex-1 py-4 bg-white border-2 border-[#002D72] text-[#002D72] font-bold text-sm tracking-widest rounded-full active:bg-gray-50"
          >
            CANCEL
          </button>
          <button
            type="button"
            onClick={handleSearch}
            disabled={!canSearch}
            className={`flex-1 py-4 font-bold text-sm tracking-widest rounded-full text-white transition-opacity ${
              canSearch ? 'bg-[#4A6FA5] active:opacity-80' : 'bg-[#4A6FA5] opacity-50'
            }`}
          >
            SEARCH
          </button>
        </div>
      </div>

    </div>
  );
}

export default CompanyPayeePage;
