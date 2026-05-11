import React, { useEffect, useState } from 'react';
import imgBoaMini from '../assets/images/boa-mini-logo.png';

const ACCOUNTS = [
  { id: 1, name: 'joint - 3083',                   balance: '$474.89' },
  { id: 2, name: 'Adv SafeBalance Banking - 3580',  balance: '$114.67' },
];

function AccountPickerModal({ open, onClose, title, selected, onSelect }) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    if (open) {
      const id = setTimeout(() => setAnimated(true), 20);
      return () => clearTimeout(id);
    }
  }, [open]);

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

      {/* Sheet — no rounded corners */}
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

        {/* BofA Accounts header */}
        <div className="flex items-center gap-3 px-5 pb-3">
          <img src={imgBoaMini} alt="BofA" className="w-9 h-7 object-contain" />
          <span className="text-gray-900 font-bold text-base">BofA Accounts</span>
        </div>

        {/* Account rows */}
        {ACCOUNTS.map((acc, i) => (
          <button
            type="button"
            key={acc.id}
            onClick={() => handleSelect(acc)}
            className={`w-full flex items-center gap-4 px-5 py-5 active:bg-gray-50 text-left ${
              i < ACCOUNTS.length - 1 ? 'border-b border-gray-200' : ''
            }`}
          >
            {/* Radio */}
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
              <p className="text-gray-900 font-medium text-base leading-snug">{acc.name}</p>
              <p className="text-gray-500 text-sm mt-0.5">Available balance {acc.balance}</p>
            </div>
          </button>
        ))}

        <div className="h-10" />
      </div>

    </div>
  );
}

export default AccountPickerModal;
