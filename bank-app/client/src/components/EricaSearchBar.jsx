import React from 'react';
import imgErica from '../assets/images/btn-erica-red.jpeg';

const IconSearch = () => (
  <svg className="w-4 h-4 text-gray-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

function EricaSearchBar({ ericaCount = 0, showProviderText = false, bgWhite = true }) {
  const py = showProviderText ? 'pt-3 pb-2' : 'py-3';
  return (
    <div className={`${bgWhite ? 'bg-white ' : ''}px-4 ${py}`}>
      <div className="flex items-center gap-3">
        <div className="flex-1 flex items-center gap-2 bg-gray-200 rounded-full px-4 py-2.5">
          <IconSearch />
          <span className="text-gray-400 text-sm font-normal">Hi, I&#39;m Erica. How can I help?</span>
        </div>
        {ericaCount > 0 ? (
          <div className="relative flex-shrink-0">
            <img src={imgErica} alt="Erica" className="w-10 h-10 rounded-full object-cover" />
            <span className="absolute -top-1 -right-1 bg-[#002D72] text-white text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
              {ericaCount}
            </span>
          </div>
        ) : (
          <div className="flex-shrink-0">
            <img src={imgErica} alt="Erica" className="w-10 h-10 rounded-full object-cover" />
          </div>
        )}
      </div>
      {showProviderText && (
        <p className="text-right text-xs text-gray-500 mt-2 mb-1">Provided by Bank of America</p>
      )}
    </div>
  );
}

export default EricaSearchBar;
