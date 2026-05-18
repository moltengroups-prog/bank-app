import React from 'react';

export default function ChatBubble({ text, isAction = false }) {
  return (
    <div className="flex justify-end px-4 mb-1.5 msg-appear">
      <div
        className={`max-w-[78%] px-5 py-3 text-white text-[15px] leading-snug ${
          isAction ? 'rounded-full' : 'rounded-2xl rounded-br-sm'
        }`}
        style={{ backgroundColor: '#1A2E70' }}
      >
        {text}
      </div>
    </div>
  );
}
