import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import imgPaperless from '../assets/images/paperless-settings-icon.png';

// ── Mock data (replace with API calls) ──────────────────────────

const ACCOUNTS = [
  {
    id: 'joint',
    label: 'joint',
    documentTypes: ['statements'],
  },
  {
    id: 'safeBalance',
    label: 'Adv Safe...ing - 3580',
    documentTypes: ['statements', 'tax'],
  },
];

const DOCUMENT_TYPES = {
  statements: {
    label: 'Statements and Documents',
    labelSubtitle: null,
    noteText: 'Please note, online statements include check images.',
  },
  tax: {
    label: 'Tax Statements',
    labelSubtitle: '(Download only)',
    noteText: null,
  },
};

const INITIAL_PREFERENCES = {
  globalPaperless: false,
  accounts: {
    joint:       { statements: 'online-only' },
    safeBalance: { statements: 'online-only', tax: 'online-mail' },
  },
};

// ── Sub-components ───────────────────────────────────────────────

const IconChevronRight = () => (
  <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

function RadioCircle({ selected, onClick, large = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${large ? 'w-10 h-10' : 'w-8 h-8'} rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
        selected ? 'bg-[#1a6bbf] border-[#1a6bbf]' : 'bg-white border-[#1a6bbf]'
      }`}
    >
      {selected && (
        <svg
          className={`${large ? 'w-5 h-5' : 'w-4 h-4'} text-white`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
      )}
    </button>
  );
}

function AccountSection({ account, prefs, onUpdate }) {
  return (
    <div>
      {/* Beige account header */}
      <div className="flex items-center px-5 py-3 bg-[#F5EFE6]">
        <span className="flex-1 text-sm font-bold text-gray-800">{account.label}</span>
        <span className="w-24 text-center text-[10px] font-bold text-gray-600 uppercase leading-tight">
          Online<br />& Mail
        </span>
        <span className="w-24 text-center text-[10px] font-bold text-gray-600 uppercase leading-tight">
          Online<br />Only
        </span>
      </div>

      {/* Document type rows */}
      {account.documentTypes.map((typeId, i) => {
        const doc = DOCUMENT_TYPES[typeId];
        const currentPref = prefs[typeId];
        return (
          <React.Fragment key={typeId}>
            {i > 0 && <div className="border-t border-gray-200" />}
            <div className="bg-white px-5 py-4">
              <div className="flex items-center">
                <div className="flex-1 pr-2">
                  <p className="text-base text-gray-800">{doc.label}</p>
                  {doc.labelSubtitle && (
                    <p className="text-sm text-gray-500 mt-0.5">{doc.labelSubtitle}</p>
                  )}
                </div>
                <div className="w-24 flex justify-center">
                  <RadioCircle
                    selected={currentPref === 'online-mail'}
                    onClick={() => onUpdate(account.id, typeId, 'online-mail')}
                  />
                </div>
                <div className="w-24 flex justify-center">
                  <RadioCircle
                    selected={currentPref === 'online-only'}
                    onClick={() => onUpdate(account.id, typeId, 'online-only')}
                  />
                </div>
              </div>
              {doc.noteText && (
                <p className="text-xs text-gray-400 mt-2 leading-snug">{doc.noteText}</p>
              )}
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────

function GoPaperlessPage() {
  const navigate = useNavigate();

  const [prefs, setPrefs]           = useState(INITIAL_PREFERENCES);
  const [savedPrefs, setSavedPrefs] = useState(INITIAL_PREFERENCES);

  const hasChanges = JSON.stringify(prefs) !== JSON.stringify(savedPrefs);

  const updateAccountPref = (accountId, docType, value) => {
    setPrefs(prev => ({
      ...prev,
      accounts: {
        ...prev.accounts,
        [accountId]: { ...prev.accounts[accountId], [docType]: value },
      },
    }));
  };

  const toggleGlobal = () => {
    const next = !prefs.globalPaperless;
    const newAccounts = {};
    ACCOUNTS.forEach(acc => {
      newAccounts[acc.id] = {};
      acc.documentTypes.forEach(typeId => {
        newAccounts[acc.id][typeId] = next ? 'online-only' : 'online-mail';
      });
    });
    setPrefs(prev => ({ ...prev, globalPaperless: next, accounts: newAccounts }));
  };

  const handleSave = () => {
    if (!hasChanges) return;
    setSavedPrefs(prefs);
    // future: await api.updatePaperlessPreferences(prefs);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 font-sans">

      <AppHeader showBackButton title="Paperless Setti..." showCartAndErica />

      <div className="flex flex-col flex-1 pt-[64px] overflow-hidden">

        {/* Provider text — non-scrolling */}
        <div className="bg-white flex-shrink-0 border-b border-gray-100">
          <p className="px-4 pt-2 pb-1.5 text-xs text-gray-500 text-right">Provided by Bank of America</p>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto pb-24">

          {/* Hero + global toggle */}
          <div className="bg-white">
            <div className="px-6 py-8 flex items-center gap-5">
              <img
                src={imgPaperless}
                alt="Go Paperless"
                className="w-[88px] h-[88px] object-contain flex-shrink-0"
              />
              <div>
                <h1 className="text-2xl font-bold text-gray-800">Go Paperless</h1>
                <button
                  type="button"
                  className="text-[#1a6bbf] text-base font-medium mt-1.5 text-left leading-snug"
                >
                  What documents are available?
                </button>
              </div>
            </div>

            <div className="border-t border-gray-200 px-5 py-5 flex items-center justify-between">
              <span className="text-base font-semibold text-gray-800 flex-1 pr-4">
                Go Paperless for all available accounts
              </span>
              <RadioCircle selected={prefs.globalPaperless} onClick={toggleGlobal} large />
            </div>
          </div>

          {/* Account sections — connect directly, no gap */}
          {ACCOUNTS.map(account => (
            <AccountSection
              key={account.id}
              account={account}
              prefs={prefs.accounts[account.id]}
              onUpdate={updateAccountPref}
            />
          ))}

          {/* Email notification */}
          <div className="border-t border-gray-200" />
          <div className="bg-[#EEF3F8] px-5 py-5">
            <p className="text-sm text-gray-600 leading-relaxed mb-3">
              Paperless document notifications will be emailed to your primary email address.
            </p>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-800">s*****0@yahoo.com</span>
              <button type="button" className="text-[#1a6bbf] font-bold text-sm tracking-widest">
                EDIT
              </button>
            </div>
          </div>

          {/* Statements & Documents link */}
          <div className="border-t border-gray-200" />
          <div className="bg-white">
            <button
              type="button"
              onClick={() => navigate('/statements-documents')}
              className="w-full flex items-center justify-between px-5 py-5 text-left active:bg-gray-50"
            >
              <span className="text-lg font-bold text-[#1a6bbf]">Statements &amp; Documents</span>
              <IconChevronRight />
            </button>
          </div>

          {/* Info text */}
          <div className="border-t border-gray-200" />
          <div className="bg-white px-5 py-5">
            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              Paper suppression is governed by the{' '}
              <button type="button" className="text-[#1a6bbf] font-medium">
                eCommunication Disclosure
              </button>
              . It may take up to 2 statement cycles for your settings to go into effect.
            </p>
            <button type="button" className="text-[#1a6bbf] font-medium text-sm block mb-4">
              View sample statement
            </button>
            <p className="text-sm text-gray-600 leading-relaxed">
              Tax statements can only be downloaded because they contain your Tax Identification Number (TIN), Social Security Number (SSN) and/or full account number.
            </p>
          </div>

        </div>
      </div>

      {/* ── Fixed SAVE button ── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200">
        <div className="px-6 py-4">
          <button
            type="button"
            onClick={handleSave}
            className={`w-full py-4 font-bold text-sm tracking-widest rounded-full text-white transition-colors ${
              hasChanges ? 'bg-[#002D72] active:bg-[#001d4a]' : 'bg-slate-400'
            }`}
          >
            SAVE
          </button>
        </div>
      </div>

    </div>
  );
}

export default GoPaperlessPage;
