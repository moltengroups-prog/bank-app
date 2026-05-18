import React from 'react';
import { useNavigate } from 'react-router-dom';

const IconX = () => (
  <svg className="w-5 h-5" fill="none" stroke="white" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const IconBack = () => (
  <svg className="w-6 h-6" fill="none" stroke="white" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const IconInfo = () => (
  <svg className="w-4.5 h-4.5" width="18" height="18" fill="none" stroke="white" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" strokeWidth={1.5} />
    <path strokeLinecap="round" strokeWidth={2} d="M12 8v.01M12 12v4" />
  </svg>
);

const LiveChatDots = () => (
  <div className="w-8 h-8 rounded-full bg-red-600 flex items-center justify-center flex-shrink-0">
    <svg width="18" height="6" fill="white" viewBox="0 0 18 6">
      <circle cx="3" cy="3" r="2.2" />
      <circle cx="9" cy="3" r="2.2" />
      <circle cx="15" cy="3" r="2.2" />
    </svg>
  </div>
);

export default function ChatHeader({ variant = 'erica', onClose, onBack }) {
  const navigate = useNavigate();

  if (variant === 'erica') {
    return (
      <div
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 py-3"
        style={{ backgroundColor: 'transparent' }}
      >
        <button
          type="button"
          onClick={onClose || (() => navigate(-1))}
          className="w-9 h-9 flex items-center justify-center"
        >
          <IconX />
        </button>
        <button
          type="button"
          className="border border-white rounded-full px-7 py-1.5"
        >
          <span className="text-white text-[13px] font-medium tracking-wide">Insights</span>
        </button>
        <button
          type="button"
          className="w-9 h-9 border border-white rounded-full flex items-center justify-center"
        >
          <IconInfo />
        </button>
      </div>
    );
  }

  // Live Chat variant
  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 flex items-center px-4 py-3"
      style={{
        backgroundColor: 'rgba(0, 8, 42, 0.96)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <button
        type="button"
        onClick={onBack || (() => navigate(-1))}
        className="w-9 h-9 flex items-center justify-center flex-shrink-0"
      >
        <IconBack />
      </button>
      <div className="flex-1 flex items-center justify-center gap-2.5">
        <LiveChatDots />
        <span className="text-white text-[17px] font-semibold">Live Chat</span>
      </div>
      <div className="w-9 flex-shrink-0" />
    </div>
  );
}
