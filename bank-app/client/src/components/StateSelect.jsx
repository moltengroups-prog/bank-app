import React, { useState, useMemo } from 'react';

const US_STATES = [
  ['AL', 'Alabama'],       ['AK', 'Alaska'],        ['AZ', 'Arizona'],
  ['AR', 'Arkansas'],      ['CA', 'California'],     ['CO', 'Colorado'],
  ['CT', 'Connecticut'],   ['DE', 'Delaware'],       ['FL', 'Florida'],
  ['GA', 'Georgia'],       ['HI', 'Hawaii'],         ['ID', 'Idaho'],
  ['IL', 'Illinois'],      ['IN', 'Indiana'],        ['IA', 'Iowa'],
  ['KS', 'Kansas'],        ['KY', 'Kentucky'],       ['LA', 'Louisiana'],
  ['ME', 'Maine'],         ['MD', 'Maryland'],       ['MA', 'Massachusetts'],
  ['MI', 'Michigan'],      ['MN', 'Minnesota'],      ['MS', 'Mississippi'],
  ['MO', 'Missouri'],      ['MT', 'Montana'],        ['NE', 'Nebraska'],
  ['NV', 'Nevada'],        ['NH', 'New Hampshire'],  ['NJ', 'New Jersey'],
  ['NM', 'New Mexico'],    ['NY', 'New York'],       ['NC', 'North Carolina'],
  ['ND', 'North Dakota'],  ['OH', 'Ohio'],           ['OK', 'Oklahoma'],
  ['OR', 'Oregon'],        ['PA', 'Pennsylvania'],   ['RI', 'Rhode Island'],
  ['SC', 'South Carolina'],['SD', 'South Dakota'],  ['TN', 'Tennessee'],
  ['TX', 'Texas'],         ['UT', 'Utah'],           ['VT', 'Vermont'],
  ['VA', 'Virginia'],      ['WA', 'Washington'],     ['WV', 'West Virginia'],
  ['WI', 'Wisconsin'],     ['WY', 'Wyoming'],
];

const IconChevronRight = () => (
  <svg className="w-4 h-4 text-[#1a6bbf] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const IconX = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

// StateSelect — renders a trigger row + bottom-sheet picker
// Props: value (state abbreviation), onChange(abbr)
export default function StateSelect({ value, onChange }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return US_STATES;
    return US_STATES.filter(
      ([abbr, name]) =>
        name.toLowerCase().includes(q) || abbr.toLowerCase().startsWith(q)
    );
  }, [query]);

  const displayLabel = useMemo(() => {
    if (!value) return 'Select payee state';
    const found = US_STATES.find(([abbr]) => abbr === value);
    return found ? `${found[1]} (${found[0]})` : value;
  }, [value]);

  function handleSelect(abbr) {
    onChange(abbr);
    setOpen(false);
    setQuery('');
  }

  function handleClose() {
    setOpen(false);
    setQuery('');
  }

  return (
    <>
      {/* Trigger row */}
      <div className="flex items-center bg-white px-4 py-5 min-h-[60px]">
        <div className="w-36 flex-shrink-0">
          <p className="text-base text-gray-900 leading-snug">State</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="flex-1 flex items-center justify-end gap-1 min-w-0"
        >
          <span className="text-[#1a6bbf] text-base truncate">{displayLabel}</span>
          <IconChevronRight />
        </button>
      </div>
      <div className="border-b border-gray-100" />

      {/* Bottom-sheet modal */}
      {open && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end">
          {/* Scrim */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={handleClose}
          />

          {/* Sheet */}
          <div className="relative bg-white rounded-t-2xl flex flex-col max-h-[80vh] z-10">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <p className="text-base font-semibold text-gray-900">Select State</p>
              <button
                type="button"
                onClick={handleClose}
                className="p-1 text-gray-500 active:text-gray-800"
              >
                <IconX />
              </button>
            </div>

            {/* Search */}
            <div className="px-4 py-3 border-b border-gray-100">
              <input
                autoFocus
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search states…"
                className="w-full bg-gray-100 rounded-xl px-4 py-2.5 text-sm text-gray-900 outline-none placeholder-gray-400"
              />
            </div>

            {/* List */}
            <div className="overflow-y-auto flex-1">
              {filtered.length === 0 && (
                <p className="px-4 py-6 text-sm text-center text-gray-400">No states found</p>
              )}
              {filtered.map(([abbr, name]) => (
                <button
                  key={abbr}
                  type="button"
                  onClick={() => handleSelect(abbr)}
                  className={`w-full flex items-center justify-between px-4 py-4 text-left border-b border-gray-50 active:bg-gray-50 ${
                    value === abbr ? 'bg-blue-50' : ''
                  }`}
                >
                  <span className="text-base text-gray-900">{name}</span>
                  <span className="text-sm font-medium text-gray-400">{abbr}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
