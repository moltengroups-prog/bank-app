import React from 'react';
import { Lightbulb } from 'lucide-react';

function WireInfoCard({ children }) {
  return (
    <div className="mx-4 bg-white rounded-2xl border border-gray-200 shadow-sm px-4 py-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full border border-[#1a6bbf] flex items-center justify-center flex-shrink-0 mt-0.5">
          <Lightbulb className="w-5 h-5 text-[#1a6bbf]" strokeWidth={1.5} />
        </div>
        <div className="flex-1 min-w-0">
          {children}
        </div>
      </div>
    </div>
  );
}

export default WireInfoCard;
