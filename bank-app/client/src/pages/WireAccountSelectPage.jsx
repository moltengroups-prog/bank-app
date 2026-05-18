import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import WireFlowFooter from '../components/WireFlowFooter';
import { useWireRecipientsStore } from '../store/wireRecipientsStore';
import { useDashboardStore } from '../store/dashboardStore';

function fmtUSD(n) {
  return '$' + Number(n).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function AccountRow({ account, selected, onSelect, isLast }) {
  return (
    <>
      <button
        type="button"
        onClick={() => onSelect(account)}
        className="w-full flex items-center gap-4 px-4 py-[18px] bg-white text-left active:bg-gray-50 transition-colors"
      >
        {/* Radio circle — matches Figma style */}
        <div
          className={`w-[22px] h-[22px] rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
            selected ? 'border-[#002D72]' : 'border-gray-400'
          }`}
        >
          {selected && (
            <div className="w-[10px] h-[10px] rounded-full bg-[#002D72]" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-[15px] font-semibold text-gray-900 leading-snug">
            {account.accountName}
            {account.maskedAccountNumber && (
              <span className="text-gray-400 font-normal"> {account.maskedAccountNumber}</span>
            )}
          </p>
          <p className="text-[13px] text-gray-500 mt-[3px]">
            Available balance {fmtUSD(account.availableBalance)}
          </p>
        </div>
      </button>

      {!isLast && <div className="h-px bg-gray-200 mx-4" />}
    </>
  );
}

function WireAccountSelectPage() {
  const navigate = useNavigate();

  const selectedRecipient      = useWireRecipientsStore((s) => s.selectedRecipient);
  const selectedFromAccount    = useWireRecipientsStore((s) => s.selectedFromAccount);
  const setSelectedFromAccount = useWireRecipientsStore((s) => s.setSelectedFromAccount);

  const accounts      = useDashboardStore((s) => s.accounts);
  const fetchAccounts = useDashboardStore((s) => s.fetchAccounts);
  const loadingAccts  = useDashboardStore((s) => s.loadingAccounts);

  useEffect(() => {
    if (!selectedRecipient) navigate('/wire-transfer/start');
  }, [selectedRecipient, navigate]);

  useEffect(() => {
    if (accounts.length === 0) fetchAccounts();
  }, [accounts.length, fetchAccounts]);

  // Include both checking AND savings — the previous bug only showed checking
  const eligibleAccounts = accounts.filter((a) => {
    const type   = (a.accountType || '').toLowerCase();
    const status = (a.status     || '').toLowerCase();
    return (type === 'checking' || type === 'savings') && status === 'active';
  });

  const selectedId = String(selectedFromAccount?.id || selectedFromAccount?._id || '');
  const canNext    = selectedFromAccount !== null;

  return (
    <div className="flex flex-col h-screen bg-gray-100 font-sans">

      <AppHeader showBackButton title="Send Money" showEricaRight ericaRightCount={4} />

      <div className="flex-1 pt-[64px] overflow-y-auto pb-24">

        {/* Page heading */}
        <h1 className="px-4 pt-6 pb-5 text-[24px] font-bold text-gray-900 leading-snug">
          Wire money from
        </h1>

        {/* ── BofA Accounts section ── */}
        <div className="mb-5">

          {/* Section label with US flag */}
          <div className="flex items-center gap-2 px-4 pb-3">
            <span
              className="fi fi-us"
              style={{ width: '1.5em', height: '1.125em', backgroundSize: 'cover', borderRadius: 2 }}
            />
            <span className="text-[12px] font-bold text-gray-700 tracking-widest uppercase">
              BofA Accounts
            </span>
          </div>

          {/* Account list */}
          <div className="bg-white border-t border-b border-gray-200">
            {loadingAccts ? (
              <div className="px-4 py-10 text-center text-gray-400 text-sm">
                Loading accounts…
              </div>
            ) : eligibleAccounts.length === 0 ? (
              <div className="px-4 py-10 text-center text-gray-400 text-sm">
                No eligible accounts found.
              </div>
            ) : (
              eligibleAccounts.map((acct, i) => (
                <AccountRow
                  key={String(acct.id || acct._id)}
                  account={acct}
                  selected={selectedId === String(acct.id || acct._id)}
                  onSelect={setSelectedFromAccount}
                  isLast={i === eligibleAccounts.length - 1}
                />
              ))
            )}
          </div>
        </div>

        {/* ── Info card ── */}
        <div className="mx-4 bg-white rounded-xl border border-gray-200 px-4 py-4">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full border border-[#002D72] flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-4 h-4 text-[#002D72]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M12 15v2m0-4v-2m0-2h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-[13px] text-gray-700 leading-relaxed">
              Make sure your account has sufficient funds before sending a wire. Your account must
              have the amount of the wire plus a minimum of $50.
            </p>
          </div>
        </div>

      </div>

      <WireFlowFooter
        cancelTo="/wire-transfer/recipient-summary"
        onNext={() => navigate('/wire-transfer/recipient-summary')}
        nextEnabled={canNext}
        nextLabel="SELECT"
      />

    </div>
  );
}

export default WireAccountSelectPage;
