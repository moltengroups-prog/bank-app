import React from 'react';
import { useNavigate } from 'react-router-dom';

function WireFlowFooter({
  cancelTo,
  onNext,
  nextEnabled = false,
  cancelLabel = 'CANCEL',
  nextLabel = 'NEXT',
}) {
  const navigate = useNavigate();
  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 px-4 py-3">
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => navigate(cancelTo)}
          className="flex-1 py-4 bg-white border-2 border-[#002D72] text-[#002D72] font-bold text-sm tracking-widest rounded-full active:bg-gray-50"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={nextEnabled ? onNext : undefined}
          disabled={!nextEnabled}
          className={`flex-1 py-4 font-bold text-sm tracking-widest rounded-full text-white bg-[#0d2852] transition-opacity ${
            nextEnabled ? 'opacity-100 active:opacity-80' : 'opacity-50'
          }`}
        >
          {nextLabel}
        </button>
      </div>
    </div>
  );
}

export default WireFlowFooter;
