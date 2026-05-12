import React from 'react';

const colors = {
  100: 'bg-gray-100',
  200: 'bg-gray-200',
  300: 'bg-gray-300',
};

function InsetDivider({ className = '', color = 300, inset = true }) {
  return (
    <div
      aria-hidden="true"
      className={`${inset ? 'mx-[15px]' : ''} h-px rounded-full ${colors[color]} ${className}`.trim()}
    />
  );
}

export default InsetDivider;
