import React, { useEffect, useRef, useState } from 'react';
import imgErica from '../assets/images/btn-erica-red.jpeg';
import LegalDisclosure from './LegalDisclosure';
import InsetDivider from './InsetDivider';

function AmountInputModal({ open, onClose, value, onDone }) {
  const [animated, setAnimated] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setDraft(value);
      const id = setTimeout(() => {
        setAnimated(true);
        inputRef.current?.focus();
      }, 20);
      return () => clearTimeout(id);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = () => {
    setAnimated(false);
    setTimeout(onClose, 280);
  };

  const handleDone = () => {
    onDone(draft);
    setAnimated(false);
    setTimeout(onClose, 280);
  };

  if (!open && !animated) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">

      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${animated ? 'opacity-100' : 'opacity-0'}`}
      />

      {/* Full-screen sheet — no rounded corners */}
      <div
        className={`relative bg-gray-100 w-full h-full flex flex-col transition-transform duration-300 ease-out ${animated ? 'translate-y-0' : 'translate-y-full'}`}
      >
        {/* Header */}
        <div className="flex-shrink-0 bg-white flex items-center justify-between px-4 py-3 shadow-sm">
          <div className="w-10" />
          <span className="text-base font-normal text-gray-500 tracking-wide">Amount</span>
          <div className="relative flex-shrink-0">
            <img src={imgErica} alt="Erica" className="w-10 h-10 rounded-full object-cover" />
            <span className="absolute -top-1 -right-1 bg-[#002D72] text-white text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
              3
            </span>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto pb-24">

          {/* Amount input field */}
          <div className="bg-white px-4 pt-4 pb-4 mb-0">
            <div className="flex items-center border border-gray-300 px-3 py-3">
              <span className="text-gray-900 text-xl mr-0.5">$</span>
              <input
                ref={inputRef}
                type="number"
                inputMode="decimal"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="0.00"
                className="flex-1 text-xl text-gray-900 outline-none bg-transparent"
              />
              {draft && (
                <button
                  type="button"
                  onClick={() => setDraft('')}
                  className="ml-2 flex-shrink-0"
                >
                  <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          <LegalDisclosure />
        </div>

        {/* Bottom buttons */}
        <div className="flex-shrink-0 bg-white">
          <InsetDivider color={200} />
          <div className="px-4 py-3 flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-4 border-2 border-[#1a6bbf] text-[#1a6bbf] font-bold text-sm tracking-widest rounded-full bg-white active:bg-gray-50"
            >
              CANCEL
            </button>
            <button
              type="button"
              onClick={handleDone}
              className="flex-1 py-4 bg-[#002D72] text-white font-bold text-sm tracking-widest rounded-full active:bg-[#001d4a]"
            >
              DONE
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}

export default AmountInputModal;
