import React from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import LegalDisclosure from '../components/LegalDisclosure';
import WireFlowFooter from '../components/WireFlowFooter';
import imgIllustration from '../assets/images/wire-send-illustration.jpg';

const hasRecipient = false; // future: replace with real recipient state

function WireStartPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col h-screen bg-white font-sans">

      <AppHeader showBackButton title="Send Money" showEricaRight ericaRightCount={4} />

      <div className="flex-1 pt-[64px] overflow-y-auto pb-24">

        <h1 className="px-4 pt-6 pb-5 text-[28px] font-bold text-gray-900 leading-tight">
          Wire details
        </h1>

        <div className="flex items-center justify-between px-4 pb-4">
          <span className="text-lg font-bold text-gray-900">Recipient</span>
          <button
            type="button"
            onClick={() => navigate('/wire-transfer/add-recipient')}
            className="flex items-center gap-1.5 active:opacity-70"
          >
            <span className="text-[#1a6bbf] font-semibold text-base">Add new recipient</span>
            <div className="w-6 h-6 rounded-full border-2 bg-[#1a6bbf] flex items-center justify-center flex-shrink-0">
              <svg className="w-3.5 h-3.5 text-[#e7e7e7]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
            </div>
          </button>
        </div>

        <div className="-mt-2 mb-4">
          <img src={imgIllustration} alt="Wire transfer illustration" className="w-full object-contain" />
        </div>

        <LegalDisclosure />
      </div>

      <WireFlowFooter
        cancelTo="/wire-transfer"
        onNext={() => {}}
        nextEnabled={hasRecipient}
      />

    </div>
  );
}

export default WireStartPage;
