import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import LegalDisclosure from '../components/LegalDisclosure';
import WireFlowFooter from '../components/WireFlowFooter';

// ── Country data ─────────────────────────────────────────────────

const COUNTRIES = [
  { code: 'US', name: 'United States',  flag: '🇺🇸', featured: true  },
  { code: 'IN', name: 'India',          flag: '🇮🇳', featured: false },
  { code: 'MX', name: 'Mexico',         flag: '🇲🇽', featured: false },
  { code: 'CA', name: 'Canada',         flag: '🇨🇦', featured: false },
  { code: 'GB', name: 'Great Britain',  flag: '🇬🇧', featured: false },
  { code: 'CN', name: 'China',          flag: '🇨🇳', featured: false },
  { code: 'ES', name: 'Spain',          flag: '🇪🇸', featured: false },
  { code: 'DE', name: 'Germany',        flag: '🇩🇪', featured: false },
  { code: 'FR', name: 'France',         flag: '🇫🇷', featured: false },
  { code: 'KR', name: 'Korea',          flag: '🇰🇷', featured: false },
  { code: 'PH', name: 'Philippines',    flag: '🇵🇭', featured: false },
  { code: 'IT', name: 'Italy',          flag: '🇮🇹', featured: false },
  { code: 'CO', name: 'Colombia',       flag: '🇨🇴', featured: false },
];

// ── Sub-components ───────────────────────────────────────────────

const IconSearch = () => (
  <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

function SearchInput({ value, onChange }) {
  return (
    <div className="flex items-center gap-3 bg-gray-100 rounded-full px-4 py-3">
      <IconSearch />
      <input
        type="text"
        value={value}
        onChange={onChange}
        placeholder="Search country"
        className="flex-1 bg-transparent outline-none text-base text-gray-700 placeholder-gray-400"
      />
    </div>
  );
}

function CountryCard({ country, selected, onSelect, fullWidth = false }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(country.code)}
      className={`bg-white rounded-2xl flex items-center text-left transition-colors active:bg-gray-50 ${
        fullWidth ? 'w-full gap-4 px-5 py-5' : 'w-full gap-3 px-4 py-4'
      } ${
        selected
          ? 'border-2 border-[#1a6bbf] shadow-sm'
          : 'border border-gray-100 shadow-sm'
      }`}
    >
      <span className={`leading-none flex-shrink-0 ${fullWidth ? 'text-5xl' : 'text-4xl'}`}>
        {country.flag}
      </span>
      <span className={`font-semibold text-gray-900 ${fullWidth ? 'text-base' : 'text-sm'}`}>
        {country.name}
      </span>
    </button>
  );
}

function CountryGrid({ countries, selected, onSelect }) {
  if (countries.length === 0) return null;
  return (
    <div className="grid grid-cols-2 gap-3">
      {countries.map(c => (
        <CountryCard key={c.code} country={c} selected={selected === c.code} onSelect={onSelect} />
      ))}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────

function WireAddRecipientPage() {
  const navigate = useNavigate();
  const [query, setQuery]         = useState('');
  const [selected, setSelected]   = useState(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COUNTRIES;
    return COUNTRIES.filter(c => c.name.toLowerCase().includes(q));
  }, [query]);

  const featured = filtered.filter(c => c.featured);
  const grid     = filtered.filter(c => !c.featured);

  const handleNext = () => {
    navigate('/wire-transfer/add-recipient/details', { state: { country: selected } });
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 font-sans">

      <AppHeader showBackButton title="Add Person or Business" showEricaRight ericaRightCount={4} />

      <div className="flex-1 pt-[64px] overflow-y-auto pb-24">

        {/* ── Heading ── */}
        <h1 className="px-4 pt-6 pb-5 text-[26px] font-bold text-gray-900 leading-snug">
          Where is the account located?
        </h1>

        {/* ── Search bar ── */}
        <div className="px-4 pb-5">
          <SearchInput value={query} onChange={e => setQuery(e.target.value)} />
        </div>

        {/* ── Featured (United States) ── */}
        {featured.length > 0 && (
          <div className="px-4 pb-4">
            {featured.map(c => (
              <CountryCard
                key={c.code}
                country={c}
                selected={selected === c.code}
                onSelect={setSelected}
                fullWidth
              />
            ))}
          </div>
        )}

        {/* ── Country grid ── */}
        {grid.length > 0 && (
          <div className="px-4 pb-6">
            <CountryGrid countries={grid} selected={selected} onSelect={setSelected} />
          </div>
        )}

        {filtered.length === 0 && (
          <p className="px-4 py-6 text-sm text-gray-400 text-center">
            No countries match &#8220;{query}&#8221;
          </p>
        )}

        <LegalDisclosure />
      </div>

      <WireFlowFooter
        cancelTo="/wire-transfer/start"
        onNext={handleNext}
        nextEnabled={selected !== null}
      />
    </div>
  );
}

export default WireAddRecipientPage;
