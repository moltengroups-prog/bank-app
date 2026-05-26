import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lightbulb } from 'lucide-react';
import AppHeader from '../components/AppHeader';
import LegalDisclosure from '../components/LegalDisclosure';
import imgHero from '../assets/images/wire-transfer-hero.jpg';
import { api } from '../services/api';
import { getSocket } from '../socket/socket';

const fmtUSD = (n) => '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (d) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const STATUS_STYLES = {
  processing:     'text-blue-600 bg-blue-50',
  completed:      'text-green-700 bg-green-50',
  'pending-review':'text-amber-700 bg-amber-50',
  rejected:       'text-red-700 bg-red-50',
  blocked:        'text-red-700 bg-red-50',
};

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
  const [recentWires,   setRecentWires]   = useState([]);
  const [loadingWires,  setLoadingWires]  = useState(true);

  const fetchWires = () => {
    api.get('/wire-transfers?limit=5')
      .then((res) => setRecentWires(res?.data || []))
      .catch(() => setRecentWires([]))
      .finally(() => setLoadingWires(false));
  };

  useEffect(() => {
    fetchWires();
  }, []);

  // Refresh when a wire settles so status updates immediately
  useEffect(() => {
    const s = getSocket();
    if (!s) return;
    s.on('wire:settled', fetchWires);
    return () => s.off('wire:settled', fetchWires);
  }, []);

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

        {/* ── Recent Wires ── */}
        {(loadingWires || recentWires.length > 0) && (
          <div className="bg-white px-4 py-6 border-t border-gray-200">
            <h2 className="text-[17px] font-bold text-gray-900 mb-4">Recent wire transfers</h2>
            {loadingWires ? (
              <div className="space-y-3">
                {[1, 2].map((n) => (
                  <div key={n} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : (
              <ul className="space-y-3">
                {recentWires.map((wire) => {
                  const rName = [wire.recipient?.firstName, wire.recipient?.lastName, wire.recipient?.businessName]
                    .filter(Boolean).join(' ') || wire.recipient?.nickname || 'Recipient';
                  const statusStyle = STATUS_STYLES[wire.status] || 'text-gray-600 bg-gray-50';
                  return (
                    <li key={wire._id} className="flex items-center justify-between gap-3 py-2 border-b border-gray-100 last:border-0">
                      <div className="min-w-0">
                        <p className="text-[14px] font-semibold text-gray-900 truncate">{rName}</p>
                        <p className="text-[12px] text-gray-400">{fmtDate(wire.submittedAt || wire.createdAt)}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${statusStyle}`}>
                          {wire.status?.replace('-', ' ')}
                        </span>
                        <span className="text-[14px] font-bold text-gray-800">{fmtUSD(wire.amount)}</span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        )}

        <LegalDisclosure />

      </div>
    </div>
  );
}

export default WireTransferPage;
