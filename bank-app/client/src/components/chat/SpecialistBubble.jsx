import React from 'react';

function Avatar() {
  return (
    <div
      className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white text-[11px] font-bold"
      style={{ backgroundColor: '#1550AA' }}
    >
      S
    </div>
  );
}

export default function SpecialistBubble({ text, showAvatar = true, showLabel = true }) {
  return (
    <div className="px-4 mb-1.5 msg-appear">
      {showLabel && (
        <p className="text-gray-400 text-[11px] ml-10 mb-1 tracking-wide">Specialist</p>
      )}
      <div className="flex items-end gap-2">
        {showAvatar ? <Avatar /> : <div className="w-8 flex-shrink-0" />}
        <div
          className="max-w-[78%] px-4 py-3 rounded-2xl rounded-bl-sm text-white text-[15px] leading-snug"
          style={{ backgroundColor: '#1565C0' }}
        >
          {text}
        </div>
      </div>
    </div>
  );
}
