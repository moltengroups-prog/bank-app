import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import LegalDisclosure from '../components/LegalDisclosure';
import WireFlowFooter from '../components/WireFlowFooter';
import { useWireRecipientsStore } from '../store/wireRecipientsStore';

const COUNTRY_NAMES = {
  US: 'United States', IN: 'India',    MX: 'Mexico',      CA: 'Canada',
  GB: 'Great Britain', CN: 'China',    ES: 'Spain',        DE: 'Germany',
  FR: 'France',        KR: 'Korea',    PH: 'Philippines',  IT: 'Italy',
  CO: 'Colombia',      AU: 'Australia', BR: 'Brazil',       JP: 'Japan',
};

function WireRecipientSummaryPage() {
  const navigate = useNavigate();

  const selectedRecipient   = useWireRecipientsStore((s) => s.selectedRecipient);
  const selectedFromAccount = useWireRecipientsStore((s) => s.selectedFromAccount);

  useEffect(() => {
    if (!selectedRecipient) navigate('/wire-transfer/start');
  }, [selectedRecipient, navigate]);

  if (!selectedRecipient) return null;

  const recipientName = [
    selectedRecipient.firstName,
    selectedRecipient.lastName,
    selectedRecipient.businessName,
  ].filter(Boolean).join(' ') || 'Recipient';

  const countryCode = (selectedRecipient.country || 'US').toUpperCase();
  const countryName = COUNTRY_NAMES[countryCode] || countryCode;

  const accountLabel = selectedFromAccount
    ? `${selectedFromAccount.accountName} ${selectedFromAccount.maskedAccountNumber || ''}`.trim()
    : null;

  const canNext = selectedFromAccount !== null;

  return (
    <div className="flex flex-col h-screen bg-gray-100 font-sans">

      <AppHeader showBackButton title="Send Money" showEricaRight ericaRightCount={4} />

      <div className="flex-1 pt-[64px] overflow-y-auto pb-24">

        {/* ── Wire details section ── */}
        <h2 className="px-4 pt-6 pb-2 text-[18px] font-bold text-gray-900">Wire details</h2>

        <div className="bg-white border-t border-b border-gray-200">

          {/* Recipient */}
          <div className="flex items-center justify-between px-4 py-[17px]">
            <span className="text-[15px] text-gray-900">Recipient</span>
            <span className="text-[15px] text-gray-500">{recipientName}</span>
          </div>

          <div className="h-px bg-gray-100 mx-4" />

          {/* Send to */}
          <div className="flex items-center justify-between px-4 py-[17px]">
            <span className="text-[15px] text-gray-900">Send to</span>
            <div className="flex items-center gap-2">
              <span className="text-[15px] text-gray-500">{countryName}</span>
              <span
                className={`fi fi-${countryCode.toLowerCase()}`}
                style={{ width: '1.4em', height: '1.05em', backgroundSize: 'cover', borderRadius: 2 }}
              />
            </div>
          </div>

        </div>

        {/* ── Which account? section ── */}
        <h2 className="px-4 pt-6 pb-2 text-[18px] font-bold text-gray-900">Which account?</h2>

        <div className="bg-white border-t border-b border-gray-200">
          <button
            type="button"
            onClick={() => navigate('/wire-transfer/account-select')}
            className="w-full flex items-center justify-between px-4 py-[17px] active:bg-gray-50"
          >
            <span className="text-[15px] text-gray-900">From</span>
            <span className={`text-[15px] ${accountLabel ? 'text-gray-900' : 'text-[#1a6bbf]'}`}>
              {accountLabel || 'Choose account'}
            </span>
          </button>
        </div>

        {/* ── Legal footer ── */}
        <LegalDisclosure />

      </div>

      <WireFlowFooter
        cancelTo="/wire-transfer/start"
        onNext={() => navigate('/wire-transfer/amount')}
        nextEnabled={canNext}
      />

    </div>
  );
}

export default WireRecipientSummaryPage;
