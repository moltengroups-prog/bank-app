import React from 'react';
import imgErica from '../../assets/images/btn-erica-red.jpeg';

export default function EricaBubble({ text, showAvatar = true }) {
  return (
    <div className="flex items-end gap-2 px-4 mb-1.5 msg-appear">
      {showAvatar ? (
        <img
          src={imgErica}
          alt="Erica"
          className="w-8 h-8 rounded-full object-cover flex-shrink-0 mb-0.5"
        />
      ) : (
        <div className="w-8 flex-shrink-0" />
      )}
      <div
        className="max-w-[78%] px-4 py-3 rounded-2xl rounded-bl-sm text-white text-[15px] leading-snug"
        style={{ backgroundColor: '#1E5DC4' }}
      >
        {text}
      </div>
    </div>
  );
}
