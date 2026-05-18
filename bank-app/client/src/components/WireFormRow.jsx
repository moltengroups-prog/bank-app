import React from 'react';

function WireFormRow({ id, label, value, onChange, placeholder, type = 'text', inputMode }) {
  return (
    <>
      <label
        htmlFor={id}
        className="flex items-center justify-between px-4 py-4 cursor-text bg-white"
      >
        <span className="text-[15px] text-gray-900 flex-shrink-0">{label}</span>
        <input
          id={id}
          type={type}
          inputMode={inputMode}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          className="flex-1 min-w-0 ml-4 text-right bg-transparent outline-none text-[15px] placeholder-[#1a6bbf] text-[#1a6bbf]"
        />
      </label>
      <div className="h-px bg-gray-200" />
    </>
  );
}

export default WireFormRow;
