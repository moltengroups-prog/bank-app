import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import LegalDisclosure from '../components/LegalDisclosure';
import WireFlowFooter from '../components/WireFlowFooter';
import WireFormRow from '../components/WireFormRow';

const US_STATES = [
  'Alabama','Alaska','Arizona','Arkansas','California','Colorado',
  'Connecticut','Delaware','Florida','Georgia','Hawaii','Idaho',
  'Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana',
  'Maine','Maryland','Massachusetts','Michigan','Minnesota',
  'Mississippi','Missouri','Montana','Nebraska','Nevada',
  'New Hampshire','New Jersey','New Mexico','New York',
  'North Carolina','North Dakota','Ohio','Oklahoma','Oregon',
  'Pennsylvania','Rhode Island','South Carolina','South Dakota',
  'Tennessee','Texas','Utah','Vermont','Virginia','Washington',
  'West Virginia','Wisconsin','Wyoming',
];

const REQUIRED_FIELDS = ['firstName', 'lastName', 'address', 'city', 'state', 'zipCode'];

function WireAddRecipientBankDetailsPage() {
  const navigate = useNavigate();
  const { state: routeState } = useLocation();
  const prevData = routeState ?? {};

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    nickname: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
  });
  const [statePickerOpen, setStatePickerOpen] = useState(false);

  const set = key => val => setForm(f => ({ ...f, [key]: val }));

  const canNext = REQUIRED_FIELDS.every(k => form[k].trim().length > 0);

  const handleNext = () => {
    navigate('/wire-transfer/add-recipient/review', {
      state: { ...prevData, recipientDetails: form },
    });
  };

  return (
    <div className="flex flex-col h-screen bg-white font-sans">

      <AppHeader showBackButton title="Add Person or Business" showEricaRight ericaRightCount={4} />

      <div className="flex-1 pt-[64px] overflow-y-auto pb-24">

        {/* ── Heading ── */}
        <h1 className="px-4 pt-6 text-[26px] font-bold text-gray-900 leading-snug">
          Who do you want to add?
        </h1>
        <p className="px-4 mt-2 mb-6 text-[15px] text-gray-700 leading-snug">
          Required fields may vary based on recipient&#39;s country.
        </p>

        {/* ── Group 1: Name ── */}
        <div className="h-px bg-gray-200" />
        <WireFormRow
          id="firstName"
          label="First name"
          value={form.firstName}
          onChange={set('firstName')}
          placeholder="Enter first name"
        />
        <WireFormRow
          id="lastName"
          label="Last name"
          value={form.lastName}
          onChange={set('lastName')}
          placeholder="Enter last name"
        />
        <WireFormRow
          id="nickname"
          label="Nickname (optional)"
          value={form.nickname}
          onChange={set('nickname')}
          placeholder="Enter nickname"
        />

        {/* ── Group 2: Address ── */}
        <div className="h-px bg-gray-200 mt-6" />
        <WireFormRow
          id="address"
          label="Recipient address"
          value={form.address}
          onChange={set('address')}
          placeholder="Enter street"
        />
        <WireFormRow
          id="city"
          label="City"
          value={form.city}
          onChange={set('city')}
          placeholder="Enter city"
        />

        {/* ── State selector row ── */}
        <div className="flex items-center justify-between px-4 py-4 bg-white">
          <span className="text-[15px] text-gray-900 flex-shrink-0">State</span>
          <button
            type="button"
            onClick={() => setStatePickerOpen(true)}
            className="text-[15px] font-bold text-[#1a6bbf] text-right ml-4"
          >
            {form.state || 'Select state'}
          </button>
        </div>
        <div className="h-px bg-gray-200" />

        <WireFormRow
          id="zipCode"
          label="ZIP code"
          value={form.zipCode}
          onChange={set('zipCode')}
          placeholder="Enter code"
          inputMode="numeric"
        />

        <LegalDisclosure />
      </div>

      <WireFlowFooter
        onCancel={() => navigate(-1)}
        onNext={handleNext}
        nextEnabled={canNext}
      />

      {/* ── State picker bottom sheet ── */}
      {statePickerOpen && (
        <div
          className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40"
          onClick={() => setStatePickerOpen(false)}
        >
          <div
            className="bg-white rounded-t-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-4 py-4 border-b border-gray-200">
              <span className="font-bold text-base text-gray-900">Select state</span>
              <button
                type="button"
                onClick={() => setStatePickerOpen(false)}
                className="text-[#1a6bbf] font-semibold text-sm"
              >
                Done
              </button>
            </div>
            <div className="overflow-y-auto max-h-72">
              {US_STATES.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => { set('state')(s); setStatePickerOpen(false); }}
                  className={`w-full px-4 py-3.5 text-left text-[15px] border-b border-gray-100 active:bg-gray-50 ${
                    form.state === s ? 'text-[#1a6bbf] font-semibold' : 'text-gray-900'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default WireAddRecipientBankDetailsPage;
