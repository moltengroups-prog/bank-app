import React from 'react';

export default function TipCard({ text }) {
  return (
    <div
      className="mx-4 my-3 rounded-2xl px-4 py-4"
      style={{ backgroundColor: 'rgba(0, 4, 24, 0.72)', border: '1px solid rgba(255,255,255,0.06)' }}
    >
      <div className="flex items-start gap-3">
        <span className="text-white text-[13px] font-bold tracking-widest flex-shrink-0 pt-px">
          TIP
        </span>
        <div className="w-px self-stretch bg-white opacity-25 flex-shrink-0" />
        <p className="text-white text-[13px] leading-relaxed opacity-90">{text}</p>
      </div>
    </div>
  );
}
