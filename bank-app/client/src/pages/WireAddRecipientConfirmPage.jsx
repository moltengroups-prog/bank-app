import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import LegalDisclosure from '../components/LegalDisclosure';
import { useWireRecipientsStore } from '../store/wireRecipientsStore';

// ── Lookup tables ─────────────────────────────────────────────────

const COUNTRY_NAMES = {
  US: 'United States', IN: 'India',       MX: 'Mexico',      CA: 'Canada',
  GB: 'Great Britain', CN: 'China',        ES: 'Spain',       DE: 'Germany',
  FR: 'France',        KR: 'Korea',        PH: 'Philippines', IT: 'Italy',
  CO: 'Colombia',
};

const STATE_ABBR = {
  'Alabama':'AL','Alaska':'AK','Arizona':'AZ','Arkansas':'AR',
  'California':'CA','Colorado':'CO','Connecticut':'CT','Delaware':'DE',
  'Florida':'FL','Georgia':'GA','Hawaii':'HI','Idaho':'ID',
  'Illinois':'IL','Indiana':'IN','Iowa':'IA','Kansas':'KS',
  'Kentucky':'KY','Louisiana':'LA','Maine':'ME','Maryland':'MD',
  'Massachusetts':'MA','Michigan':'MI','Minnesota':'MN','Mississippi':'MS',
  'Missouri':'MO','Montana':'MT','Nebraska':'NE','Nevada':'NV',
  'New Hampshire':'NH','New Jersey':'NJ','New Mexico':'NM','New York':'NY',
  'North Carolina':'NC','North Dakota':'ND','Ohio':'OH','Oklahoma':'OK',
  'Oregon':'OR','Pennsylvania':'PA','Rhode Island':'RI','South Carolina':'SC',
  'South Dakota':'SD','Tennessee':'TN','Texas':'TX','Utah':'UT',
  'Vermont':'VT','Virginia':'VA','Washington':'WA','West Virginia':'WV',
  'Wisconsin':'WI','Wyoming':'WY',
};

function maskAccount(num) {
  if (!num || num.length <= 4) return num || '';
  return '*'.repeat(num.length - 4) + num.slice(-4);
}

// ── Sub-components ────────────────────────────────────────────────

function ReviewRow({ label, value, last = false }) {
  return (
    <>
      <div className="flex items-center justify-between px-4 py-4 bg-white">
        <span className="text-[15px] text-gray-900 flex-shrink-0">{label}</span>
        <span className="text-[15px] text-gray-500 text-right ml-4 min-w-0 flex items-center gap-2 justify-end">
          {value}
        </span>
      </div>
      {!last && <div className="h-px bg-gray-200" />}
    </>
  );
}

function ReviewSection({ title, children }) {
  return (
    <div>
      <p className="px-4 pt-6 pb-2 text-[16px] font-bold text-gray-900">{title}</p>
      <div className="bg-white border-t border-b border-gray-200">
        {children}
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────

function WireAddRecipientConfirmPage() {
  const navigate = useNavigate();
  const { state: routeState } = useLocation();

  const country = routeState?.country ?? '';
  const rd      = routeState?.recipientDetails ?? {};
  const bi      = routeState?.bankInfo ?? {};

  const addRecipient        = useWireRecipientsStore((s) => s.addRecipient);
  const setSelectedRecipient = useWireRecipientsStore((s) => s.setSelectedRecipient);

  const [isAdding,      setIsAdding]      = useState(false);
  const [error,         setError]         = useState('');
  const [showScamModal, setShowScamModal] = useState(false);

  const countryName  = COUNTRY_NAMES[country] ?? country;
  const stateDisplay = STATE_ABBR[rd.state] ?? rd.state ?? '';
  const maskedAcct   = maskAccount(bi.accountNumber);
  const fullName     = [rd.firstName, rd.lastName].filter(Boolean).join('  ');

  const handleAdd = async () => {
    setIsAdding(true);
    setError('');
    try {
      const saved = await addRecipient({
        country,
        currency:         routeState?.currency       ?? 'USD',
        recipientType:    routeState?.recipientType  ?? 'individual',
        ownershipType:    routeState?.ownershipType  ?? 'personal',
        firstName:        rd.firstName   ?? '',
        lastName:         rd.lastName    ?? '',
        businessName:     rd.businessName ?? '',
        nickname:         rd.nickname    ?? '',
        recipientAddress: rd.address     ?? '',
        city:             rd.city        ?? '',
        state:            rd.state       ?? '',
        postalCode:       rd.zipCode     ?? '',
        bankName:         bi.bankName    ?? '',
        routingNumber:    bi.routingNumber ?? '',
        swiftCode:        bi.swiftCode   ?? '',
        accountNumber:    bi.accountNumber ?? '',
      });
      setSelectedRecipient(saved);
      // Continue straight to transfer flow with the newly added recipient
      navigate('/wire-transfer/recipient-summary', { replace: true });
    } catch (err) {
      setError(err.message || 'Failed to add recipient. Please try again.');
      setIsAdding(false);
    }
  };

  const countryValue = (
    <>
      {countryName}
      {country && (
        <span
          className={`fi fi-${country.toLowerCase()} flex-shrink-0`}
          style={{ width: '1.4em', height: '1.05em', backgroundSize: 'cover', borderRadius: 2 }}
        />
      )}
    </>
  );

  return (
    <div className="flex flex-col h-screen bg-gray-100 font-sans">

      <AppHeader showBackButton title="Add Person or Business" showEricaRight ericaRightCount={4} />

      <div className="flex-1 pt-[64px] overflow-y-auto pb-24">

        {/* ── Heading ── */}
        <h1 className="px-4 pt-6 pb-2 text-[26px] font-bold text-gray-900 leading-snug">
          Does everything look okay?
        </h1>

        {/* ── Recipient Details ── */}
        <ReviewSection title="Recipient Details">
          <ReviewRow label="Send to"           value={countryValue}      />
          <ReviewRow label="Recipient"          value={fullName}          />
          <ReviewRow label="Recipient address"  value={rd.address ?? ''}  />
          <ReviewRow label="City"               value={rd.city ?? ''}     />
          <ReviewRow label="State"              value={stateDisplay}      />
          <ReviewRow label="ZIP code"           value={rd.zipCode ?? ''}  last />
        </ReviewSection>

        {/* ── Bank Details ── */}
        <ReviewSection title="Bank Details">
          <ReviewRow label="Routing number" value={bi.routingNumber ?? ''} />
          <ReviewRow label="Account number" value={maskedAcct}              last />
        </ReviewSection>

        {/* ── Error message ── */}
        {error && (
          <p className="mx-4 mt-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3">
            {error}
          </p>
        )}

        {/* ── EDIT button ── */}
        <div className="flex justify-center py-8">
          <button
            type="button"
            onClick={() => navigate('/wire-transfer/add-recipient/bank-details', { state: routeState })}
            className="px-10 py-3 border-2 border-[#002D72] text-[#002D72] font-bold text-sm tracking-widest rounded-full bg-white active:bg-gray-50"
          >
            EDIT
          </button>
        </div>

        <LegalDisclosure />
      </div>

      {/* ── ADD sticky footer ── */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-gray-100 border-t border-gray-200 py-4 flex justify-center">
        <button
          type="button"
          onClick={() => setShowScamModal(true)}
          disabled={isAdding}
          className="w-48 py-4 bg-[#002D72] text-white font-bold text-sm tracking-widest rounded-full active:bg-[#001d4a] disabled:opacity-70"
        >
          {isAdding ? 'ADDING...' : 'ADD'}
        </button>
      </div>

      {/* ── Scam Warning Modal ── */}
      {showScamModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40">
          <div className="w-full max-w-lg bg-white rounded-t-2xl px-5 pt-6 pb-8 shadow-2xl">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Beware of possible scams</h2>
            <p className="text-[14px] text-gray-700 font-semibold mb-3">
              Money you send may not be recoverable
            </p>
            <p className="text-[13px] text-gray-600 mb-2">Do not proceed if you are:</p>
            <ul className="text-[13px] text-gray-700 space-y-1.5 mb-5 pl-1">
              <li>• Pressured to act quickly</li>
              <li>• Asked to open an account or deposit funds, then wire money back out</li>
              <li>• Asked to make last-minute changes to your wiring instructions</li>
            </ul>
            <p className="text-[13px] text-gray-600 leading-relaxed mb-6">
              Verify your recipient by calling a number on an official website or other sources
              like your card, recent bill or statement.
            </p>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowScamModal(false)}
                className="flex-1 py-4 border-2 border-[#002D72] text-[#002D72] font-bold text-sm tracking-widest rounded-full"
              >
                CANCEL
              </button>
              <button
                type="button"
                onClick={() => { setShowScamModal(false); handleAdd(); }}
                disabled={isAdding}
                className="flex-1 py-4 bg-[#002D72] text-white font-bold text-sm tracking-widest rounded-full disabled:opacity-60"
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WireAddRecipientConfirmPage;
