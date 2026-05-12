import React, { useEffect, useState } from 'react';
import InsetDivider from './InsetDivider';
import imgErica from '../assets/images/btn-erica-red.jpeg';

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];
const SHORT_MONTHS = [
  'Jan','Feb','Mar','Apr','May','Jun',
  'Jul','Aug','Sep','Oct','Nov','Dec',
];
const DAY_HEADERS = ['S','M','T','W','T','F','S'];

function DatePickerModal({ open, onClose, selectedDate, onDone }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [animated, setAnimated] = useState(false);
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear]   = useState(today.getFullYear());
  const [pickedDate, setPickedDate] = useState(selectedDate || today);

  useEffect(() => {
    if (open) {
      setPickedDate(selectedDate || today);
      setViewMonth((selectedDate || today).getMonth());
      setViewYear((selectedDate || today).getFullYear());
      const id = setTimeout(() => setAnimated(true), 20);
      return () => clearTimeout(id);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleClose = () => {
    setAnimated(false);
    setTimeout(onClose, 280);
  };

  const handleDone = () => {
    onDone(pickedDate);
    setAnimated(false);
    setTimeout(onClose, 280);
  };

  const isCurrentMonthView =
    viewMonth === today.getMonth() && viewYear === today.getFullYear();

  const prevMonth = () => {
    if (isCurrentMonthView) return;
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const daysInMonth  = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();

  const cells = [];
  for (let i = 0; i < firstDayOfWeek; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const rows = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));

  const isToday = (d) =>
    d === today.getDate() && viewMonth === today.getMonth() && viewYear === today.getFullYear();

  const isPast = (d) => new Date(viewYear, viewMonth, d) < today;

  const isPicked = (d) =>
    pickedDate &&
    d === pickedDate.getDate() &&
    viewMonth === pickedDate.getMonth() &&
    viewYear === pickedDate.getFullYear();

  const formatDate = (date) =>
    `${SHORT_MONTHS[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;

  if (!open && !animated) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">

      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-300 ${animated ? 'opacity-100' : 'opacity-0'}`}
      />

      {/* Full-screen sheet — no rounded corners */}
      <div
        className={`relative bg-white w-full h-full flex flex-col transition-transform duration-300 ease-out ${animated ? 'translate-y-0' : 'translate-y-full'}`}
      >
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-white shadow-sm">
          <button type="button" onClick={handleClose} className="flex items-center justify-center w-8 h-8 flex-shrink-0">
            <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-base font-normal text-gray-500 tracking-wide">Make a Transfer</span>
          <div className="relative flex-shrink-0">
            <img src={imgErica} alt="Erica" className="w-10 h-10 rounded-full object-cover" />
            <span className="absolute -top-1 -right-1 bg-[#002D72] text-white text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center">3</span>
          </div>
        </div>

        {/* Date heading + Transfer On */}
        <div className="flex-shrink-0 flex items-center justify-between px-4 py-4 bg-white">
          <h2 className="text-3xl font-extrabold text-gray-900">Date</h2>
          <span className="text-sm text-gray-500">Transfer On: {formatDate(pickedDate)}</span>
        </div>
        <InsetDivider color={100} />

        {/* Calendar */}
        <div className="flex-1 overflow-y-auto bg-white px-4 pb-28">

          {/* Month nav */}
          <div className="flex items-center justify-between py-4">
            <button
              type="button"
              onClick={prevMonth}
              disabled={isCurrentMonthView}
              className={`w-8 h-8 flex items-center justify-center ${isCurrentMonthView ? 'text-gray-300' : 'text-[#1a6bbf]'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="text-lg font-medium text-gray-900">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </span>
            <button
              type="button"
              onClick={nextMonth}
              className="w-8 h-8 flex items-center justify-center text-[#1a6bbf]"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAY_HEADERS.map((h, i) => (
              <div key={i} className="text-center text-gray-500 font-semibold text-sm py-1">
                {h}
              </div>
            ))}
          </div>

          {/* Calendar rows */}
          {rows.map((row, ri) => (
            <div key={ri} className="grid grid-cols-7">
              {row.map((day, di) => {
                if (!day) return <div key={di} className="py-2" />;
                const past     = isPast(day);
                const todayDay = isToday(day);
                const picked   = isPicked(day);
                const highlight = todayDay || picked;

                return (
                  <button
                    type="button"
                    key={di}
                    onClick={() => !past && setPickedDate(new Date(viewYear, viewMonth, day))}
                    disabled={past}
                    className="flex flex-col items-center justify-center py-1"
                  >
                    <div
                      className={`w-10 h-10 flex flex-col items-center justify-center rounded-lg ${
                        highlight ? 'bg-[#002D72]' : ''
                      }`}
                    >
                      <span
                        className={`text-lg leading-none ${
                          highlight
                            ? 'text-white font-bold'
                            : past
                            ? 'text-gray-300 font-normal'
                            : 'text-gray-900 font-bold'
                        }`}
                      >
                        {day}
                      </span>
                      {todayDay && (
                        <span className="text-white text-[9px] leading-none mt-0.5">Today</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Bottom buttons */}
        <div className="flex-shrink-0 bg-white">
          <InsetDivider color={200} />
          <div className="px-4 py-3 flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 py-4 border-2 border-[#1a6bbf] text-[#1a6bbf] font-bold text-sm tracking-widest rounded-full bg-white active:bg-gray-50"
            >
              CANCEL
            </button>
            <button
              type="button"
              onClick={handleDone}
              className="flex-1 py-4 bg-[#002D72] text-white font-bold text-sm tracking-widest rounded-full active:bg-[#001d4a]"
            >
              DONE
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}

export default DatePickerModal;
