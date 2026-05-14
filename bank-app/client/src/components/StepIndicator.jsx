import React from 'react';

function StepIndicator({ currentStep = 1, totalSteps = 3 }) {
  const W = 168;
  const dotCenters = [24, 84, 144];
  const activeCenterX = dotCenters[currentStep - 1];
  const bluePct = (activeCenterX / W) * 100;

  return (
    <div className="flex justify-center py-6">
      <div className="relative" style={{ width: W, height: 16 }}>
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1.5px] bg-gray-200" />
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-[1.5px] bg-[#002D72]"
          style={{ width: `${bluePct}%` }}
        />
        {dotCenters.map((cx, i) => {
          const step     = i + 1;
          const isActive = step === currentStep;
          const isDone   = step < currentStep;
          const size     = isActive ? 15 : 13;
          return (
            <div
              key={step}
              className={`absolute rounded-full ${isActive || isDone ? 'bg-[#002D72]' : 'bg-gray-300'}`}
              style={{ width: size, height: size, left: cx - size / 2, top: '50%', transform: 'translateY(-50%)' }}
            />
          );
        })}
      </div>
    </div>
  );
}

export default StepIndicator;
