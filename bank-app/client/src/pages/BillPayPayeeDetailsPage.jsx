import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import LegalDisclosure from '../components/LegalDisclosure';
import StepIndicator from '../components/StepIndicator';

// ── Sub-components ───────────────────────────────────────────────

const IconChevronRight = () => (
  <svg className="w-4 h-4 text-[#1a6bbf] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

function FormRow({ label, subtitle, placeholder, value, onChange, type = 'text', inputMode }) {
  return (
    <>
      <div className="flex items-center bg-white px-4 py-5 min-h-[60px]">
        <div className="w-36 flex-shrink-0">
          <p className="text-base text-gray-900 leading-snug">{label}</p>
          {subtitle && <p className="text-sm text-gray-400 leading-snug">{subtitle}</p>}
        </div>
        <input
          type={type}
          inputMode={inputMode}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className="flex-1 min-w-0 text-right bg-transparent outline-none text-[#1a6bbf] placeholder-[#1a6bbf] text-base"
        />
      </div>
      <div className="border-b border-gray-100" />
    </>
  );
}

function StateRow({ value, onSelect }) {
  return (
    <>
      <div className="flex items-center bg-white px-4 py-5 min-h-[60px]">
        <div className="w-36 flex-shrink-0">
          <p className="text-base text-gray-900 leading-snug">State</p>
        </div>
        <button
          type="button"
          onClick={onSelect}
          className="flex-1 flex items-center justify-end gap-1 min-w-0"
        >
          <span className="text-[#1a6bbf] text-base truncate">
            {value || 'Select payee state'}
          </span>
          <IconChevronRight />
        </button>
      </div>
      <div className="border-b border-gray-100" />
    </>
  );
}

// ── Page ─────────────────────────────────────────────────────────

const REQUIRED = ['firstName', 'lastName', 'address', 'city', 'state', 'zipCode', 'phoneNumber'];

function BillPayPayeeDetailsPage() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    firstName:       '',
    lastName:        '',
    nickname:        '',
    identifyingInfo: '',
    address:         '',
    addressTwo:      '',
    city:            '',
    state:           '',
    zipCode:         '',
    phoneNumber:     '',
  });

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const canSave = REQUIRED.every(f => form[f].trim().length > 0);

  const handleSave = () => {
    if (!canSave) return;
    // future: POST payee to API, then navigate to confirmation step
    console.log('Saving Bill Pay payee:', form);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-100 font-sans">

      <AppHeader showBackButton title="Add Payee" showSpacer />

      {/* Scrollable body — pb-24 clears the fixed button bar */}
      <div className="flex-1 pt-[64px] overflow-y-auto pb-24">

        {/* Step 2 of 3 */}
        <StepIndicator currentStep={2} totalSteps={3} />

        {/* Intro text */}
        <p className="px-4 pb-5 text-base text-gray-800 leading-snug">
          Enter the person&#39;s information.
        </p>

        {/* ── Form rows ── */}
        <div>
          <FormRow
            label="First Name"
            placeholder="Enter payee first name"
            value={form.firstName}
            onChange={set('firstName')}
          />
          <FormRow
            label="Last Name"
            placeholder="Enter payee last name"
            value={form.lastName}
            onChange={set('lastName')}
          />
          <FormRow
            label="Nickname"
            subtitle="(Optional)"
            placeholder="Enter payee nickname"
            value={form.nickname}
            onChange={set('nickname')}
          />
          <FormRow
            label="Identifying Info"
            subtitle="(Optional)"
            placeholder="Identifying Info"
            value={form.identifyingInfo}
            onChange={set('identifyingInfo')}
          />
          <FormRow
            label="Address"
            placeholder="Enter payee address"
            value={form.address}
            onChange={set('address')}
          />
          <FormRow
            label="Address Two"
            subtitle="(Optional)"
            placeholder="Enter payee address"
            value={form.addressTwo}
            onChange={set('addressTwo')}
          />
          <FormRow
            label="City"
            placeholder="Enter payee city"
            value={form.city}
            onChange={set('city')}
          />
          <StateRow
            value={form.state}
            onSelect={() => {
              // future: open state picker sheet
            }}
          />
          <FormRow
            label="ZIP Code"
            placeholder="Enter payee ZIP code"
            value={form.zipCode}
            onChange={set('zipCode')}
            type="text"
            inputMode="numeric"
          />
          <FormRow
            label="Phone Number"
            placeholder="Enter payee phone"
            value={form.phoneNumber}
            onChange={set('phoneNumber')}
            type="tel"
            inputMode="tel"
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
            onClick={handleSave}
            disabled={!canSave}
            className={`flex-1 py-4 font-bold text-sm tracking-widest rounded-full text-white transition-opacity bg-[#4A6FA5] ${
              canSave ? 'opacity-100 active:opacity-80' : 'opacity-50'
            }`}
          >
            SAVE
          </button>
        </div>
      </div>

    </div>
  );
}

export default BillPayPayeeDetailsPage;
