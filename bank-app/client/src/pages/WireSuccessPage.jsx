import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import InsetDivider from '../components/InsetDivider';
import { useWireRecipientsStore } from '../store/wireRecipientsStore';
import { useDashboardStore } from '../store/dashboardStore';

const SHORT_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const COUNTRY_NAMES = {
  US: 'United States', IN: 'India',    MX: 'Mexico',      CA: 'Canada',
  GB: 'Great Britain', CN: 'China',    ES: 'Spain',        DE: 'Germany',
  FR: 'France',        KR: 'Korea',    PH: 'Philippines',  IT: 'Italy',
  CO: 'Colombia',      AU: 'Australia', BR: 'Brazil',       JP: 'Japan',
};

function fmtUSD(n) {
  return '$' + Number(n).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmtDate(date) {
  return `${SHORT_MONTHS[date.getMonth()]} ${date.getDate()}`;
}

function addBusinessDays(date, days) {
  const result = new Date(date);
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    const dow = result.getDay();
    if (dow !== 0 && dow !== 6) added++;
  }
  return result;
}

function DetailRow({ label, right }) {
  return (
    <div className="flex items-start justify-between px-5 py-[18px]">
      <span className="text-[15px] text-gray-900 flex-shrink-0 mr-4">{label}</span>
      <div className="text-right max-w-[58%]">{right}</div>
    </div>
  );
}

function WireSuccessPage() {
  const navigate = useNavigate();
  const [checkVisible, setCheckVisible] = useState(false);

  const wireResult        = useWireRecipientsStore((s) => s.wireResult);
  const selectedRecipient = useWireRecipientsStore((s) => s.selectedRecipient);
  const fetchAccounts     = useDashboardStore((s) => s.fetchAccounts);

  useEffect(() => {
    if (!wireResult) navigate('/wire-transfer');
  }, [wireResult, navigate]);

  useEffect(() => {
    if (wireResult) {
      const t = setTimeout(() => setCheckVisible(true), 80);
      return () => clearTimeout(t);
    }
  }, [wireResult]);

  if (!wireResult) return null;

  const sentDate      = wireResult.submittedAt ? new Date(wireResult.submittedAt) : new Date();
  const availableDate = addBusinessDays(sentDate, 3);

  // Build recipient address from whatever fields exist
  const countryCode = (selectedRecipient?.country || 'US').toUpperCase();
  const countryName = COUNTRY_NAMES[countryCode] || countryCode;
  const addressParts = [
    selectedRecipient?.city,
    selectedRecipient?.state,
    selectedRecipient?.postalCode,
    countryName.toUpperCase(),
  ].filter(Boolean);
  const addressLine = addressParts.join(', ');

  const handleDone = () => {
    fetchAccounts();
    navigate('/pay-transfer');
  };

  return (
    <div className="flex flex-col h-screen bg-white font-sans">

      <AppHeader title="Success" showEricaRight ericaRightCount={4} />

      <div className="flex-1 pt-[64px] overflow-y-auto pb-28">

        {/* ── Animated checkmark + title ── */}
        <div className="flex flex-col items-center pt-10 pb-8 px-6">
          <div
            className={`
              w-[72px] h-[72px] rounded-full border-[2.5px] border-green-500
              flex items-center justify-center mb-6
              transition-all duration-500 ease-out
              ${checkVisible ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}
            `}
          >
            <svg className="w-9 h-9 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
          </div>

          <h1 className="text-[22px] font-extrabold text-gray-900 text-center leading-snug mb-5">
            Your wire is processing
          </h1>

          {/* SHARE pill */}
          <button
            type="button"
            className="px-7 py-1.5 border border-gray-300 rounded-full text-[12px] font-bold text-gray-500 tracking-widest uppercase"
          >
            Share
          </button>
        </div>

        {/* ── Delivery details ── */}
        <div className="bg-white border-t border-b border-gray-200">

          <DetailRow
            label="Date sent"
            right={<span className="text-[15px] text-gray-500">{fmtDate(sentDate)}</span>}
          />
          <InsetDivider color={100} />

          <DetailRow
            label="Date available"
            right={
              <>
                <p className="text-[15px] text-gray-500">{fmtDate(availableDate)}</p>
                <p className="text-[12px] text-gray-400 mt-0.5">May be available earlier</p>
              </>
            }
          />
          <InsetDivider color={100} />

          <DetailRow
            label="Confirmation #"
            right={
              <span className="text-[14px] text-gray-500 font-mono tracking-wide">
                {wireResult.referenceNumber || '—'}
              </span>
            }
          />
          <InsetDivider color={100} />

          <DetailRow
            label="To"
            right={<span className="text-[15px] text-gray-500">{wireResult.recipientName}</span>}
          />

          {addressLine ? (
            <>
              <InsetDivider color={100} />
              <DetailRow
                label="Recipient address"
                right={
                  <p className="text-[15px] text-gray-500 leading-snug">
                    {addressLine}
                  </p>
                }
              />
            </>
          ) : null}

        </div>

        {/* ── Total transfer cost ── */}
        <h2 className="px-5 pt-6 pb-3 text-[16px] font-bold text-gray-900">
          Your total transfer cost
        </h2>

        <div className="bg-white border-t border-b border-gray-200">

          <DetailRow
            label="Transfer amount"
            right={
              <>
                <p className="text-[15px] text-gray-500">{fmtUSD(wireResult.amount)} USD</p>
                {wireResult.fromAccountName && (
                  <p className="text-[12px] text-gray-400 mt-0.5">From {wireResult.fromAccountName}</p>
                )}
              </>
            }
          />
          <InsetDivider color={100} />

          <DetailRow
            label="Transfer fees"
            right={<span className="text-[15px] text-gray-500">+{fmtUSD(wireResult.fee)} USD</span>}
          />
          <InsetDivider color={100} />

          <DetailRow
            label={<span className="font-bold">Total cost</span>}
            right={<span className="text-[15px] font-bold text-gray-900">{fmtUSD(wireResult.total)} USD</span>}
          />

        </div>

        {/* ── Pending-review notice ── */}
        {wireResult.pendingReview && (
          <div className="mx-4 mt-5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-4">
            <p className="text-[13px] text-amber-800 leading-relaxed">
              Your wire is under security review and will be processed once approved.
              You'll be notified of the outcome.
            </p>
          </div>
        )}

      </div>

      {/* ── DONE button ── */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200">
        <div className="px-5 py-4">
          <button
            type="button"
            onClick={handleDone}
            className="w-full py-[17px] bg-[#002D72] text-white font-bold text-sm tracking-widest rounded-full active:bg-[#001d4a] transition-colors"
          >
            DONE
          </button>
        </div>
      </div>

    </div>
  );
}

export default WireSuccessPage;
