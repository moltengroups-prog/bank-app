import React from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import LegalDisclosure from '../components/LegalDisclosure';
import StepIndicator from '../components/StepIndicator';

// ── Sub-components ───────────────────────────────────────────────

const IconChevronRight = () => (
  <svg className="w-5 h-5 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

function CardRow({ label, subtitle, onClick, topRadius = false, bottomRadius = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full bg-white flex items-center justify-between px-5 py-4 text-left active:bg-gray-50 ${
        topRadius ? 'rounded-t-2xl' : ''
      } ${bottomRadius ? 'rounded-b-2xl' : ''}`}
    >
      <div className="flex-1 pr-3">
        <p className="text-base text-gray-900 leading-snug">{label}</p>
        {subtitle && (
          <p className="text-xs text-gray-400 mt-0.5 leading-snug">{subtitle}</p>
        )}
      </div>
      <IconChevronRight />
    </button>
  );
}

// ── Page ─────────────────────────────────────────────────────────

function AddPayeePage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen bg-gray-100 font-sans">

      <AppHeader showBackButton title="Add Payee" showSpacer />

      <div className="flex-1 pt-[64px] overflow-y-auto pb-8">

        {/* Progress steps */}
        <StepIndicator currentStep={1} totalSteps={3} />

        {/* Main heading */}
        <h1 className="px-5 pb-6 text-[22px] font-bold text-gray-900 leading-snug">
          Who do you want to add?
        </h1>

        {/* ── Company card ── */}
        <div className="mx-4 mb-4 rounded-2xl shadow-sm overflow-hidden">
          <CardRow
            label="Company"
            topRadius
            bottomRadius
            onClick={() => navigate('/company-payee')}
          />
        </div>

        {/* ── Person card ── */}
        <div className="mx-4 mb-5 rounded-2xl shadow-sm overflow-hidden">
          {/* Zelle row */}
          <CardRow
            label={
              <span>
                Pay them with{' '}
                <span className="text-[#6D1ED4]">Zelle®</span>
              </span>
            }
            subtitle="Send money quickly using their US mobile # / email"
            topRadius
            onClick={() => {}}
          />
          {/* Divider */}
          <div className="bg-white">
            <div className="border-t border-gray-100 mx-5" />
          </div>
          {/* Bill Pay row */}
          <CardRow
            label="Pay them with Bill Pay"
            subtitle="Mail a check to their US address in 4-7 days"
            bottomRadius
            onClick={() => navigate('/bill-pay-payee-details')}
          />
        </div>

        {/* Learn more link */}
        <div className="px-5 mb-6">
          <button type="button" className="text-sm text-[#1a6bbf] text-left leading-snug">
            Learn when to use{' '}
            <span>Zelle</span>
            {' '}vs. Bill Pay
          </button>
        </div>

        <LegalDisclosure />
      </div>

    </div>
  );
}

export default AddPayeePage;
