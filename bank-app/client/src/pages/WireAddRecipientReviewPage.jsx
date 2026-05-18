import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import LegalDisclosure from '../components/LegalDisclosure';
import WireFlowFooter from '../components/WireFlowFooter';
import WireFormRow from '../components/WireFormRow';
import WireInfoCard from '../components/WireInfoCard';

function WireAddRecipientReviewPage() {
  const navigate = useNavigate();
  const { state: routeState } = useLocation();
  const prevData = routeState ?? {};

  const [form, setForm] = useState({
    routingNumber: '',
    accountNumber: '',
    confirmAccount: '',
  });

  const set = key => val => setForm(f => ({ ...f, [key]: val }));

  const accountsMatch =
    form.accountNumber.length > 0 &&
    form.accountNumber === form.confirmAccount;

  const canNext =
    form.routingNumber.trim().length > 0 &&
    form.accountNumber.trim().length > 0 &&
    accountsMatch;

  const handleNext = () => {
    navigate('/wire-transfer/add-recipient/confirm', {
      state: { ...prevData, bankInfo: form },
    });
  };

  return (
    <div className="flex flex-col h-screen bg-white font-sans">

      <AppHeader showBackButton title="Add Person or Business" showEricaRight ericaRightCount={4} />

      <div className="flex-1 pt-[64px] overflow-y-auto pb-24">

        {/* ── Heading ── */}
        <h1 className="px-4 pt-6 pb-6 text-[26px] font-bold text-gray-900 leading-snug">
          Add their account info
        </h1>

        {/* ── Form rows ── */}
        <div className="h-px bg-gray-200" />
        <WireFormRow
          id="routingNumber"
          label="Routing number"
          value={form.routingNumber}
          onChange={set('routingNumber')}
          placeholder="Enter number"
          inputMode="numeric"
        />
        <WireFormRow
          id="accountNumber"
          label="Account number"
          value={form.accountNumber}
          onChange={set('accountNumber')}
          placeholder="Enter number"
          inputMode="numeric"
        />
        <WireFormRow
          id="confirmAccount"
          label="Confirm account"
          value={form.confirmAccount}
          onChange={set('confirmAccount')}
          placeholder="Enter number"
          inputMode="numeric"
        />

        {/* ── Info card ── */}
        <div className="mt-6">
          <WireInfoCard>
            <p className="text-[14px] text-gray-700 leading-relaxed">
              Make sure you use the recipient bank&#39;s wire routing number. Banks use different
              routing numbers for different types of transactions. Using the wrong routing number
              can lead to delays in processing the transfer or being rejected and returned.
            </p>
            <p className="text-[14px] text-gray-700 leading-relaxed mt-3">
              If you&#39;re not sure which routing number you&#39;ll need for a wire transfer,
              check with the recipient before sending.
            </p>
          </WireInfoCard>
        </div>

        <LegalDisclosure />
      </div>

      <WireFlowFooter
        cancelTo="/wire-transfer/add-recipient/bank-details"
        onNext={handleNext}
        nextEnabled={canNext}
      />
    </div>
  );
}

export default WireAddRecipientReviewPage;
