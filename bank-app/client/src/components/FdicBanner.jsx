import React from 'react';
import imgFdic from '../assets/images/fdic-logo.png';

/**
 * Reusable FDIC disclosure row used across banking pages.
 *
 * Props:
 *   label         {string|null}  — heading above the logo row, e.g. "Bank of Molten deposit products:"
 *   labelBold     {boolean}      — bold + dark vs italic + gray label style
 *   showInvestment{boolean}      — append "Investment products are not FDIC-Insured."
 *   size          {'sm'|'md'}    — 'sm' for compact card contexts, 'md' (default) for full-width sections
 */
function FdicBanner({ label = null, labelBold = false, showInvestment = false, size = 'md' }) {
  const isSmall = size === 'sm';

  return (
    <>
      {label && (
        <p className={`mb-2 leading-snug ${
          labelBold
            ? 'text-sm font-bold text-gray-900'
            : 'text-sm italic text-gray-500'
        }`}>
          {label}
        </p>
      )}

      <div className={`flex items-start ${isSmall ? 'gap-1.5' : 'gap-2'}`}>
        <img
          src={imgFdic}
          alt="FDIC"
          className={`object-contain flex-shrink-0 mt-0.5 ${isSmall ? 'h-[14px] w-auto' : 'h-[18px] w-auto'}`}
        />
        <p className={`leading-snug ${
          isSmall
            ? 'text-[10px] text-gray-500'
            : 'text-xs text-gray-500 italic'
        }`}>
          FDIC-Insured &#8211; Backed by the full faith and credit of the U.S. Government
        </p>
      </div>

      {showInvestment && (
        <p className="text-sm font-bold text-gray-900 mt-2">
          Investment products are not FDIC-Insured.
        </p>
      )}
    </>
  );
}

export default FdicBanner;
