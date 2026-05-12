import React, { useEffect, useState } from 'react';
import InsetDivider from '../components/InsetDivider';

function DetailRow({ label, value, last }) {
  return (
    <>
      <div className="flex justify-between items-start px-5 py-4">
        <span className="text-gray-900 text-base font-normal flex-shrink-0 mr-4">{label}</span>
        <span className="text-gray-400 text-base text-right leading-snug">{value}</span>
      </div>
      {!last && <InsetDivider color={200} />}
    </>
  );
}

function ActivityDetailsPage({ transaction, onClose, rounded = true }) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    if (transaction) {
      const id = setTimeout(() => setAnimated(true), 20);
      return () => clearTimeout(id);
    }
  }, [transaction]);

  const handleClose = () => {
    setAnimated(false);
    setTimeout(onClose, 280);
  };

  if (!transaction) return null;

  const rows = [
    { label: 'Status',              value: transaction.status },
    { label: 'To',                  value: transaction.to },
    { label: 'From',                value: transaction.from },
    { label: 'Amount',              value: transaction.amount },
    { label: 'Date',                value: transaction.date },
    { label: 'Confirmation number', value: transaction.confirmationNumber },
  ];

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">

      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${animated ? 'opacity-100' : 'opacity-0'}`}
        onClick={handleClose}
      />

      {/* Bottom sheet */}
      <div
        className={`relative bg-white max-h-[88vh] overflow-y-auto transition-transform duration-300 ease-out ${rounded ? 'rounded-t-3xl' : ''} ${animated ? 'translate-y-0' : 'translate-y-full'}`}
      >
        {/* Drag handle — only shown for rounded variant */}
        {rounded && (
          <div className="flex justify-center pt-3 pb-0">
            <div className="w-10 h-1 bg-gray-300 rounded-full" />
          </div>
        )}

        {/* Close button */}
        <div className="flex justify-end px-5 pt-3 pb-1">
          <button
            type="button"
            onClick={handleClose}
            className="text-[#1a6bbf] font-semibold text-base"
          >
            Close
          </button>
        </div>

        {/* Details heading */}
        <div className="px-5 pb-5">
          <h2 className="text-3xl font-extrabold text-gray-900">Details</h2>
        </div>

        {/* Detail rows */}
        <InsetDivider color={200} />
        <div className="bg-white">
          {rows.map((row, i) => (
            <DetailRow
              key={row.label}
              label={row.label}
              value={row.value}
              last={i === rows.length - 1}
            />
          ))}
        </div>

      </div>

    </div>
  );
}

export default ActivityDetailsPage;
