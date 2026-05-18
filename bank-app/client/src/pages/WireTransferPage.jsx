import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Lightbulb } from 'lucide-react';
import AppHeader from '../components/AppHeader';
import LegalDisclosure from '../components/LegalDisclosure';
import imgHero from '../assets/images/wire-transfer-hero.jpg';

// ── Mock data ────────────────────────────────────────────────────

const CURRENCIES = [
  { countryCode: 'in', country: 'India',         code: 'INR' },
  { countryCode: 'gb', country: 'Great Britain',  code: 'GBP' },
  { countryCode: 'mx', country: 'Mexico',         code: 'MXN' },
  { countryCode: 'ca', country: 'Canada',         code: 'CAD' },
];

// ── Sub-components ───────────────────────────────────────────────

function CurrencyCard({ countryCode, country, code }) {
  return (
    <button
      type="button"
      className="bg-white rounded-2xl border border-gray-200 flex items-center gap-3 px-4 py-4 text-left active:bg-gray-50 shadow-sm"
    >
      <span className={`fi fi-${countryCode} text-3xl flex-shrink-0`} style={{ width: '2em', height: '1.5em', backgroundSize: 'cover', borderRadius: 3 }} />
      <div>
        <p className="text-base font-semibold text-gray-900 leading-snug">{country}</p>
        <p className="text-sm text-gray-400 leading-snug">{code}</p>
      </div>
    </button>
  );
}

// ── Page ─────────────────────────────────────────────────────────

function WireTransferPage() {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen bg-white font-sans">

      <AppHeader showBackButton onBack={() => navigate('/pay-transfer')} title="Wire" showEricaRight ericaRightCount={4} />

      <div className="flex-1 pt-[64px] overflow-y-auto">

        {/* ── Hero image ── */}
        <div className="w-full h-56 overflow-hidden">
          <img
            src={imgHero}
            alt="Wire transfer"
            className="w-full h-full object-cover object-center"
          />
        </div>

        {/* ── Intro section ── */}
        <div className="bg-white px-6 pt-7 pb-6 flex flex-col items-center">
          <h1 className="text-xl font-bold text-gray-900 text-center leading-snug mb-6">
            Send money globally with a wire
          </h1>

          <button
            type="button"
            onClick={() => navigate('/wire-transfer/start')}
            className="bg-[#002D72] text-white font-bold text-sm tracking-widest rounded-full px-12 py-4 active:bg-[#001d4a] mb-6"
          >
            START A WIRE
          </button>

          {/* Info row */}
          <div className="flex items-start gap-3 w-full">
            <div className="w-9 h-9 rounded-full border border-[#1a6bbf] flex items-center justify-center flex-shrink-0">
              <Lightbulb className="w-5 h-5 text-[#1a6bbf]" strokeWidth={1.5} />
            </div>
            <p className="text-sm text-gray-700 leading-snug pt-0.5">
              Check out what you&#39;ll need to know before sending a wire.{' '}
              <button type="button" className="text-[#1a6bbf] font-medium">
                More
              </button>
            </p>
          </div>
        </div>

        {/* ── Exchange rates section ── */}
        <div className="bg-gray-100 px-4 pt-7 pb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-5">
            Check our exchange rates and fees
          </h2>

          {/* 2×2 currency grid */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            {CURRENCIES.map(c => (
              <CurrencyCard key={c.code} {...c} />
            ))}
          </div>

          {/* Search currencies link */}
          <div className="flex justify-center py-2">
            <button
              type="button"
              className="text-[#1a6bbf] text-base font-medium"
            >
              Search currencies
            </button>
          </div>
        </div>

        <LegalDisclosure />

      </div>
    </div>
  );
}

export default WireTransferPage;
