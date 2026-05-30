import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';

const SHORT_MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function fmtDate(d) {
  if (!d) return '';
  const date = new Date(d);
  return `${SHORT_MONTHS[date.getMonth()]} ${date.getDate()}`;
}

function fmtUSD(n) {
  return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ── Individual payee row ───────────────────────────────────────────
function PayeeRow({ payee, onPay }) {
  const lastInfo = payee.lastPaymentAmount && payee.lastPaymentDate
    ? `${fmtUSD(payee.lastPaymentAmount)} paid on ${fmtDate(payee.lastPaymentDate)}`
    : payee.accountNumber ? `Account ••••${payee.accountNumber.slice(-4)}` : '';

  return (
    <button
      type="button"
      onClick={() => onPay(payee)}
      className="w-full flex items-center justify-between px-5 py-4 bg-white active:bg-gray-50 border-b border-gray-100 last:border-0 text-left"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <div className="min-w-0">
          <p className="text-[15px] font-semibold text-gray-900 truncate">{payee.nickname || payee.name}</p>
          {lastInfo && (
            <p className="text-[12px] text-gray-400 truncate">{lastInfo}</p>
          )}
        </div>
      </div>
      <svg className="w-5 h-5 text-gray-300 flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
}

// ── Panel ─────────────────────────────────────────────────────────
export default function BillPayRecipientsPanel({ isOpen, onClose }) {
  const navigate  = useNavigate();
  const [payees,  setPayees]  = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    api.get('/bill-pay/payees')
      .then((res) => setPayees(res?.data || []))
      .catch(() => setPayees([]))
      .finally(() => setLoading(false));
  }, [isOpen]);

  const handlePay = (payee) => {
    onClose();
    navigate(`/pay-bill?payeeId=${payee._id}`);
  };

  const handleAddPayee = () => {
    onClose();
    navigate('/add-payee');
  };

  const handleGoToBillPay = () => {
    onClose();
    navigate('/bill-pay');
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-2xl shadow-2xl max-h-[85vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 flex-shrink-0">
          <h2 className="text-[20px] font-bold text-gray-900">Recipients</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-[#1a6bbf] font-semibold text-[15px]"
          >
            Close
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto">

          {loading ? (
            <div className="space-y-2 px-4 py-4">
              {[1, 2, 3].map(n => (
                <div key={n} className="h-14 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : (
            <>
              {/* Other payees section */}
              {payees.length > 0 && (
                <>
                  <p className="px-5 pt-3 pb-2 text-[13px] font-semibold text-gray-500">Other payees</p>
                  <div className="border-t border-b border-gray-100">
                    {payees.map(payee => (
                      <PayeeRow key={payee._id} payee={payee} onPay={handlePay} />
                    ))}
                  </div>
                </>
              )}

              {/* Add new payee */}
              <button
                type="button"
                onClick={handleAddPayee}
                className="w-full flex items-center gap-3 px-5 py-4 bg-white active:bg-gray-50 border-b border-gray-100"
              >
                <div className="w-9 h-9 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                </div>
                <span className="text-[15px] font-semibold text-gray-700">Add a new payee</span>
                <svg className="w-5 h-5 text-gray-300 ml-auto flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>

              {/* Empty state */}
              {payees.length === 0 && (
                <p className="px-5 py-4 text-[14px] text-gray-400">
                  You haven't added any payees yet.
                </p>
              )}
            </>
          )}

          {/* Go to Bill Pay */}
          <div className="px-5 pt-4 pb-6">
            <button
              type="button"
              onClick={handleGoToBillPay}
              className="text-[#1a6bbf] font-semibold text-[15px]"
            >
              Go to Bill Pay
            </button>
          </div>

          {/* View hidden payees */}
          <div className="px-5 pb-8">
            <button type="button" className="text-[#1a6bbf] text-[14px]">
              View hidden payees
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
