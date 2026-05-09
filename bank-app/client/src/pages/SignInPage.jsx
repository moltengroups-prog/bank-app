import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import logo from '../assets/logos/logo.png';
import imgCashback from '../assets/images/box-cashback.jpeg';
import imgCD from '../assets/images/box-cd.jpeg';
import imgQR from '../assets/images/box-qr.jpeg';
import imgBonus from '../assets/images/box-bonus.jpeg';

function SignInPage() {
  const [touchId, setTouchId] = useState(false);
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col font-sans">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-5 pt-8 pb-5">
        <h1 className="text-[22px] font-extrabold tracking-wide text-[#002D72]">
          BANK OF MOLTEN
        </h1>
        <img src={logo} alt="Bank of Molten" className="h-11 w-auto" />
      </div>

      {/* ── Sign-In Card ── */}
      <div className="mx-4 bg-white rounded-2xl shadow-sm px-6 pt-6 pb-8">

        {/* User ID */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-900 mb-3">
            User ID
          </label>
          <div className="flex items-center border-b border-gray-300 pb-2">
            <input
              type="text"
              defaultValue="Trina****"
              className="flex-1 text-[#1a6bbf] font-medium text-base focus:outline-none bg-transparent"
            />
            <span className="text-gray-400 text-xl ml-2">›</span>
          </div>
        </div>

        {/* Password */}
        <div className="mb-7">
          <label className="block text-sm font-medium text-gray-900 mb-3">
            Password
          </label>
          <div className="border-b border-gray-300 pb-6">
            <input
              type="password"
              className="w-full text-base focus:outline-none bg-transparent"
            />
          </div>
        </div>

        {/* Touch ID */}
        <div className="flex items-center gap-3 mb-7">
          <button
            type="button"
            onClick={() => setTouchId(!touchId)}
            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
              touchId ? 'border-[#1a6bbf] bg-[#1a6bbf]' : 'border-gray-400 bg-white'
            }`}
          >
            {touchId && <div className="w-2 h-2 rounded-full bg-white" />}
          </button>
          <span className="text-[#1a6bbf] font-medium text-sm">Set up Touch ID</span>
        </div>

        {/* Log In Button */}
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="w-full bg-[#002D72] text-white font-bold text-base tracking-widest py-4 rounded-full mb-5"
        >
          LOG IN
        </button>

        {/* Forgot */}
        <button type="button" className="w-full text-center text-[#1a6bbf] font-semibold text-sm">
          Forgot user ID/password
        </button>
      </div>

      {/* ── Nav Links ── */}
      <div className="flex items-center justify-center flex-wrap gap-x-3 gap-y-1 px-4 py-5 text-[#1a6bbf] font-medium text-sm">
        <button type="button" className="text-[#1a6bbf] font-medium text-sm">My Balance®</button>
        <span className="text-gray-400">|</span>
        <button type="button" className="text-[#1a6bbf] font-medium text-sm">Enroll</button>
        <span className="text-gray-400">|</span>
        <button type="button" className="text-[#1a6bbf] font-medium text-sm">Locations</button>
        <span className="text-gray-400">|</span>
        <button type="button" className="text-[#1a6bbf] font-medium text-sm">Contact us</button>
      </div>

      {/* ── FDIC ── */}
      <div className="px-4 pb-5">
        <p className="text-gray-500 text-sm italic mb-2">
          Bank of Molten deposit products:
        </p>
        <div className="flex items-start gap-3">
          <span className="border-2 border-gray-800 text-gray-800 font-extrabold text-xs px-1.5 py-0.5 flex-shrink-0">
            FDIC
          </span>
          <p className="text-xs text-gray-600 leading-snug">
            FDIC-Insured - Backed by the full faith and credit of the U.S. Government
          </p>
        </div>
      </div>

      {/* ── Promo Cards 2×2 ── */}
      <div className="px-4 pb-5 grid grid-cols-2 gap-3">
        <div className="border border-gray-500 rounded-xl overflow-hidden">
          <img src={imgCashback} alt="Cash back offer" className="w-full h-full object-cover" />
        </div>
        <div className="border border-gray-700 rounded-xl overflow-hidden">
          <img src={imgCD} alt="Watch your money grow with a CD" className="w-full h-full object-cover" />
        </div>
        <div className="border border-gray-700 rounded-xl overflow-hidden">
          <img src={imgQR} alt="Zelle QR codes" className="w-full h-full object-cover" />
        </div>
        <div className="border border-gray-700 rounded-xl overflow-hidden">
          <img src={imgBonus} alt="Business Advantage bonus offer" className="w-full h-full object-cover" />
        </div>
      </div>

      {/* ── Legal ── */}
      <div className="px-4 pt-4 pb-2 border-t border-gray-300">
        <p className="text-xs text-gray-500 mb-4">
          Learn more about Merrill's background on{' '}
          <button type="button" className="text-[#1a6bbf]">FINRA's BrokerCheck</button>.
        </p>

        <h2 className="font-bold text-lg text-gray-900 mb-3">
          Legal info and disclosures
        </h2>

        <p className="text-sm text-gray-700 mb-2">
          Investment, insurance and annuity products:
        </p>
        <ul className="text-sm text-gray-700 space-y-1 mb-4">
          <li>• Are Not FDIC Insured</li>
          <li>• Are Not Bank Guaranteed</li>
          <li>• May Lose Value</li>
          <li>• Are Not Deposits</li>
          <li>• Are Not Insured by Any Federal Government Agency</li>
          <li>• Are Not a Condition to Any Banking Service or Activity</li>
        </ul>

        <p className="text-sm text-gray-700 font-bold mb-3">
          Investing involves risk. There is always the potential of losing money when you
          invest in securities. Asset allocation, diversification, and rebalancing do not
          ensure a profit or protect against loss in declining markets.
        </p>

        <p className="text-sm text-gray-700 mb-3">
          Bank of Molten, Merrill, their affiliates and advisors do not provide legal,
          tax or accounting advice. Clients should consult their legal and/or tax advisors
          before making any financial decisions.
        </p>

        <p className="text-sm text-gray-700 mb-3">
          Merrill offers a broad range of brokerage, investment advisory and other
          services. Additional information is available in our{' '}
          <button type="button" className="text-[#1a6bbf]">Client Relationship Summary.</button>
        </p>

        <p className="text-sm text-gray-700 mb-3">
          Banking products are provided by Bank of Molten, N.A. ("BANA") and affiliated
          banks, Members FDIC and wholly owned subsidiaries of BofM Corp.
        </p>

        <button type="button" className="text-[#1a6bbf] text-sm font-medium leading-snug text-left">
          See additional information about Merrill and Bank of Molten
        </button>
      </div>

      {/* ── Footer ── */}
      <div className="border-t border-gray-300 px-4 pt-6 pb-8 mt-3 space-y-3">
        <div className="flex justify-center gap-8">
          <button type="button" className="text-[#1a6bbf] text-sm font-medium">Browse with Specialist</button>
          <button type="button" className="text-[#1a6bbf] text-sm font-medium">Security</button>
        </div>
        <div className="flex justify-center gap-10">
          <button type="button" className="text-[#1a6bbf] text-sm font-medium">Privacy</button>
          <button type="button" className="text-[#1a6bbf] text-sm font-medium">Children's Privacy</button>
        </div>
        <div className="flex justify-center gap-6">
          <button type="button" className="text-[#1a6bbf] text-sm font-medium">Your Privacy Choices</button>
          <button type="button" className="text-[#1a6bbf] text-sm font-medium">AdChoices</button>
        </div>
        <div className="flex justify-center gap-6 flex-wrap">
          <button type="button" className="text-[#1a6bbf] text-sm font-medium">Legal Info &amp; Disclosures</button>
          <button type="button" className="text-[#1a6bbf] text-sm font-medium">Equal Housing Lender</button>
        </div>
        <p className="text-center text-gray-500 text-xs pt-2">
          Bank of Molten, N.A. Member FDIC. © 2026 Bank of Molten Corporation.
        </p>
      </div>

    </div>
  );
}

export default SignInPage;
