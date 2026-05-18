import React, { useEffect, useState } from 'react';
import InsetDivider from './InsetDivider';
import imgBoaMini from '../assets/images/boa-mini-logo.png';
import { useDashboardStore } from '../store/dashboardStore';
import { formatBalance } from '../utils/format';

function AccountPickerModal({ open, onClose, title, selected, onSelect }) {
  const [animated, setAnimated] = useState(false);
  const { accounts, loadingAccounts, fetchAccounts } = useDashboardStore();

  useEffect(() => {
    if (open) {
      const id = setTimeout(() => setAnimated(true), 20);
      fetchAccounts();
      return () => clearTimeout(id);
    }
  }, [open, fetchAccounts]);

  const handleClose = () => {
    setAnimated(false);
    setTimeout(onClose, 280);
  };

  const handleSelect = (acc) => {
    onSelect(acc);
    handleClose();
  };

  if (!open && !animated) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">

      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${animated ? 'opacity-100' : 'opacity-0'}`}
        onClick={handleClose}
      />

      {/* Sheet */}
      <div
        className={`relative bg-white w-full transition-transform duration-300 ease-out ${animated ? 'translate-y-0' : 'translate-y-full'}`}
      >
        {/* Close */}
        <div className="flex justify-end px-5 pt-5 pb-1">
          <button type="button" onClick={handleClose} className="text-[#1a6bbf] font-semibold text-base">
            Close
          </button>
        </div>

        {/* Title */}
        <div className="px-5 pt-2 pb-8">
          <h2 className="text-4xl font-extrabold text-gray-900">{title}</h2>
        </div>

        {/* Header */}
        <div className="flex items-center gap-3 px-5 pb-3">
          <img src={imgBoaMini} alt="Bank of Molten" className="w-9 h-7 object-contain" />
          <span className="text-gray-900 font-bold text-base">Bank of Molten Accounts</span>
        </div>

        {/* Account rows */}
        {loadingAccounts ? (
          [1, 2].map((n) => (
            <div key={n} className="flex items-center gap-4 px-5 py-5 animate-pulse">
              <div className="w-6 h-6 rounded-full bg-gray-200 flex-shrink-0" />
              <div className="flex-1">
                <div className="h-3 bg-gray-200 rounded w-40 mb-2" />
                <div className="h-2.5 bg-gray-100 rounded w-24" />
              </div>
            </div>
          ))
        ) : accounts.length === 0 ? (
          <p className="px-5 py-4 text-gray-400 text-sm">No accounts found.</p>
        ) : (
          accounts.map((acc, i) => (
            <React.Fragment key={acc.id}>
              <button
                type="button"
                onClick={() => handleSelect(acc)}
                className="w-full flex items-center gap-4 px-5 py-5 active:bg-gray-50 text-left"
              >
                <div
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    selected?.id === acc.id ? 'border-[#1a6bbf]' : 'border-gray-400'
                  }`}
                >
                  {selected?.id === acc.id && (
                    <div className="w-3 h-3 rounded-full bg-[#1a6bbf]" />
                  )}
                </div>
                <div>
                  <p className="text-gray-900 font-medium text-base leading-snug">
                    {acc.accountName} {acc.maskedAccountNumber}
                  </p>
                  <p className="text-gray-500 text-sm mt-0.5">
                    Available balance {formatBalance(acc.availableBalance)}
                  </p>
                </div>
              </button>
              {i < accounts.length - 1 && <InsetDivider color={200} />}
            </React.Fragment>
          ))
        )}

        <div className="h-10" />
      </div>

    </div>
  );
}

export default AccountPickerModal;
