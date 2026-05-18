import React from 'react';
import imgErica from '../../assets/images/btn-erica-red.jpeg';

export default function TypingIndicator({ showAvatar = true }) {
  return (
    <div className="flex items-end gap-2 px-4 mb-2 msg-appear">
      {showAvatar ? (
        <img
          src={imgErica}
          alt=""
          className="w-8 h-8 rounded-full object-cover flex-shrink-0 mb-0.5"
        />
      ) : (
        <div className="w-8 flex-shrink-0" />
      )}
      <div
        className="flex items-center gap-1.5 px-4 py-3.5 rounded-2xl rounded-bl-sm"
        style={{ backgroundColor: '#1E5DC4' }}
      >
        <span className="typing-dot block w-2 h-2 bg-white rounded-full" />
        <span className="typing-dot block w-2 h-2 bg-white rounded-full" />
        <span className="typing-dot block w-2 h-2 bg-white rounded-full" />
      </div>
    </div>
  );
}
