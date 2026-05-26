import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import LegalDisclosure from '../components/LegalDisclosure';
import WireFlowFooter from '../components/WireFlowFooter';

const ACCOUNT_TYPES = [
  { id: 'personal-checking', label: 'Personal checking' },
  { id: 'personal-savings',  label: 'Personal savings'  },
  { id: 'business-checking', label: 'Business checking' },
  { id: 'business-savings',  label: 'Business savings'  },
];

const OWNERSHIP_OPTIONS = [
  { id: 'my-account',   label: 'My account'             },
  { id: 'someone-else', label: "Someone else's account" },
];

function RadioOption({ label, selected, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full flex items-center gap-4 py-4 text-left active:bg-gray-50"
    >
      <div className="w-6 h-6 rounded-full border-2 border-[#1a6bbf] flex items-center justify-center flex-shrink-0">
        {selected && <div className="w-[11px] h-[11px] rounded-full bg-[#1a6bbf]" />}
      </div>
      <span className="text-[17px] text-gray-900">{label}</span>
    </button>
  );
}

function WireAddRecipientDetailsPage() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const country = state?.country ?? null;

  const [accountType, setAccountType] = useState(null);
  const [ownership,   setOwnership]   = useState(null);

  const canNext = accountType !== null && ownership !== null;

  // Map UI selections → backend enum values
  const getBackendTypes = () => {
    const isPersonal = accountType?.startsWith('personal');
    return {
      recipientType: isPersonal ? 'individual' : 'business',
      ownershipType: isPersonal ? 'personal'   : 'business',
    };
  };

  const handleNext = () => {
    navigate('/wire-transfer/add-recipient/bank-details', {
      state: { country, accountType, ownership, ...getBackendTypes() },
    });
  };

  return (
    <div className="flex flex-col h-screen bg-white font-sans">

      <AppHeader showBackButton title="Add Person or Business" showEricaRight ericaRightCount={4} />

      <div className="flex-1 pt-[64px] overflow-y-auto pb-24">

        {/* ── Section 1 ── */}
        <h1 className="px-4 pt-6 pb-1 text-[26px] font-bold text-gray-900 leading-snug">
          What type of account are you sending to?
        </h1>

        <div className="px-4">
          {ACCOUNT_TYPES.map(opt => (
            <RadioOption
              key={opt.id}
              label={opt.label}
              selected={accountType === opt.id}
              onSelect={() => setAccountType(opt.id)}
            />
          ))}
        </div>

        {/* ── Section 2 ── */}
        <h2 className="px-4 pt-6 pb-1 text-[26px] font-bold text-gray-900 leading-snug">
          Whose account is it?
        </h2>

        <div className="px-4">
          {OWNERSHIP_OPTIONS.map(opt => (
            <RadioOption
              key={opt.id}
              label={opt.label}
              selected={ownership === opt.id}
              onSelect={() => setOwnership(opt.id)}
            />
          ))}
        </div>

        <LegalDisclosure />
      </div>

      <WireFlowFooter
        onCancel={() => navigate(-1)}
        onNext={handleNext}
        nextEnabled={canNext}
      />
    </div>
  );
}

export default WireAddRecipientDetailsPage;
