import React, { useEffect, useState } from 'react';
import imgPayBills from '../assets/images/pay-bills-icon.png';

function BillPayEnrollModal({ isOpen, onClose, onContinue }) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const id = setTimeout(() => setAnimated(true), 20);
      return () => clearTimeout(id);
    }
  }, [isOpen]);

  const handleClose = () => {
    setAnimated(false);
    setTimeout(onClose, 280);
  };

  const handleContinue = () => {
    setAnimated(false);
    setTimeout(onContinue || onClose, 280);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">

      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${animated ? 'opacity-100' : 'opacity-0'}`}
        onClick={handleClose}
      />

      {/* Bottom sheet — no rounded corners */}
      <div
        className={`relative bg-white transition-transform duration-300 ease-out ${animated ? 'translate-y-0' : 'translate-y-full'}`}
      >
        {/* Close button */}
        <div className="flex justify-end px-5 pt-4 pb-0">
          <button
            type="button"
            onClick={handleClose}
            className="text-[#1a6bbf] font-semibold text-base"
          >
            Close
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col items-center px-8 pt-6 pb-10">
          <img
            src={imgPayBills}
            alt="Pay Bills"
            className="w-20 h-20 object-contain mb-6"
          />
          <h2 className="text-2xl font-extrabold text-gray-900 text-center mb-3">
            We're taking you to Bill Pay
          </h2>
          <p className="text-base text-gray-500 text-center leading-snug mb-8">
            Enroll in Bill Pay to make payments to this account.
          </p>
          <button
            type="button"
            onClick={handleContinue}
            className="w-full py-4 bg-[#002D72] text-white font-bold text-sm tracking-widest rounded-full active:bg-[#001d4a]"
          >
            OK
          </button>
        </div>
      </div>

    </div>
  );
}

export default BillPayEnrollModal;
