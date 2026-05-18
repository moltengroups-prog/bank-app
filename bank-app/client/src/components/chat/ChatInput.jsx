import React from 'react';

const MicIcon = () => (
  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
    <path d="M19 10v2a7 7 0 0 1-14 0v-2H3v2a9 9 0 0 0 8 8.94V23h2v-2.06A9 9 0 0 0 21 12v-2h-2z" />
  </svg>
);

const SendIcon = () => (
  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
  </svg>
);

export default function ChatInput({
  value,
  onChange,
  onSend,
  placeholder = 'Type or ask me something',
  showMic = false,
  showSendButton = true,
}) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 flex items-center gap-3 px-4 py-4"
      style={{
        backgroundColor: 'rgba(0, 6, 35, 0.97)',
        borderTop: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="flex-1 bg-transparent text-white text-[15px] outline-none placeholder-gray-500 min-w-0"
      />
      {showSendButton && (
        <button
          type="button"
          onClick={onSend}
          className="flex-shrink-0 w-12 h-12 rounded-full bg-red-600 flex items-center justify-center active:bg-red-700 transition-colors"
        >
          {showMic ? <MicIcon /> : <SendIcon />}
        </button>
      )}
    </div>
  );
}
