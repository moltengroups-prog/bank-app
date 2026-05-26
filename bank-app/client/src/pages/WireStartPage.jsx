import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import LegalDisclosure from '../components/LegalDisclosure';
import WireFlowFooter from '../components/WireFlowFooter';
import { useWireRecipientsStore } from '../store/wireRecipientsStore';
import imgIllustration from '../assets/images/wire-send-illustration.jpg';

// ── Helpers ───────────────────────────────────────────────────────

function getInitials(r) {
  if (r.firstName && r.lastName) return (r.firstName[0] + r.lastName[0]).toUpperCase();
  if (r.firstName) return r.firstName.slice(0, 2).toUpperCase();
  if (r.businessName) return r.businessName.slice(0, 2).toUpperCase();
  return '??';
}

// ── Recipient avatar grid card ────────────────────────────────────

function RecipientGridCard({ recipient, selected, onSelect }) {
  const initials = getInitials(recipient);
  const fullName = [recipient.firstName, recipient.lastName].filter(Boolean).join(' ')
    || recipient.businessName || 'Recipient';
  const displayName = recipient.nickname
    ? `${fullName} (${recipient.nickname})`
    : fullName;
  const countryCode = (recipient.country || 'us').toLowerCase();

  return (
    <button
      type="button"
      onClick={() => onSelect(recipient)}
      className="flex flex-col items-center gap-1.5 py-2 active:opacity-75 focus:outline-none"
    >
      {/* Avatar + flag badge */}
      <div className="relative">
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center text-lg font-bold transition-all ${
            selected
              ? 'bg-[#1a6bbf] text-white ring-2 ring-[#1a6bbf] ring-offset-2'
              : 'bg-gray-200 text-gray-600'
          }`}
        >
          {initials}
        </div>
        {/* Country flag badge */}
        <span
          className={`fi fi-${countryCode} absolute bottom-0 right-0`}
          style={{
            width: '1.4em',
            height: '1.05em',
            backgroundSize: 'cover',
            borderRadius: 3,
            border: '1.5px solid #fff',
          }}
        />
      </div>

      {/* Name */}
      <p className="text-[12px] text-gray-800 text-center leading-tight max-w-[80px] line-clamp-2">
        {displayName}
      </p>
    </button>
  );
}

// ── Page ──────────────────────────────────────────────────────────

function WireStartPage() {
  const navigate = useNavigate();

  const recipients        = useWireRecipientsStore((s) => s.recipients);
  const selectedRecipient = useWireRecipientsStore((s) => s.selectedRecipient);
  const setSelected       = useWireRecipientsStore((s) => s.setSelectedRecipient);
  const loadRecipients    = useWireRecipientsStore((s) => s.loadRecipients);
  const loading           = useWireRecipientsStore((s) => s.loading);

  useEffect(() => { loadRecipients(); }, [loadRecipients]);

  const hasRecipient = selectedRecipient !== null;

  return (
    <div className="flex flex-col h-screen bg-white font-sans">

      <AppHeader showBackButton title="Send Money" showEricaRight ericaRightCount={4} />

      <div className="flex-1 pt-[64px] overflow-y-auto pb-24">

        {/* ── Recipient section header ── */}
        <div className="flex items-center justify-between px-4 pt-6 pb-4">
          <span className="text-[22px] font-bold text-gray-900">Recipient</span>
          <button
            type="button"
            onClick={() => navigate('/wire-transfer/add-recipient')}
            className="flex items-center gap-1.5 active:opacity-70"
          >
            <span className="text-[#1a6bbf] font-semibold text-base">Add new recipient</span>
            <div className="w-6 h-6 rounded-full bg-[#1a6bbf] flex items-center justify-center flex-shrink-0">
              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
            </div>
          </button>
        </div>

        {/* ── Content area ── */}
        {loading ? (
          <div className="px-4 py-10 text-center text-gray-400 text-sm">Loading…</div>
        ) : recipients.length === 0 ? (
          /* No recipients — show illustration */
          <div className="-mt-2 mb-4">
            <img
              src={imgIllustration}
              alt="Wire transfer illustration"
              className="w-full object-contain"
            />
          </div>
        ) : (
          /* Recipients exist — show grid */
          <>
            <div className="px-4 grid grid-cols-3 gap-x-2 gap-y-4 mb-2">
              {recipients.map((r) => (
                <RecipientGridCard
                  key={r._id || r.id}
                  recipient={r}
                  selected={
                    selectedRecipient?._id === (r._id || r.id) ||
                    selectedRecipient?.id  === (r._id || r.id)
                  }
                  onSelect={setSelected}
                />
              ))}
            </div>

            <div className="h-px bg-gray-100 mx-4 mt-2 mb-4" />

            <div className="flex justify-end px-4">
              <button
                type="button"
                onClick={() => navigate('/wire-transfer/add-recipient')}
                className="text-[#1a6bbf] text-sm font-semibold active:opacity-70"
              >
                All recipients
              </button>
            </div>
          </>
        )}

        <LegalDisclosure />
      </div>

      <WireFlowFooter
        onCancel={() => navigate('/pay-transfer')}
        onNext={() => navigate('/wire-transfer/recipient-summary')}
        nextEnabled={hasRecipient}
      />
    </div>
  );
}

export default WireStartPage;
