import React, { useState } from 'react';

interface DateSelectorProps {
  selectedDate: Date | null;
  onDateChange: (date: Date) => void;
}

const DateSelector: React.FC<DateSelectorProps> = ({ selectedDate, onDateChange }) => {
  const [showDateList, setShowDateList] = useState(false);

  const isToday = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const selected = new Date(date);
    selected.setHours(0, 0, 0, 0);

    return selected.getTime() === today.getTime();
  };

  const formatDate = (date: Date) => {
    if (isToday(date)) return 'Today';
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      day: '2-digit',
      month: 'short',
    });
  };

  const isSameOrAfterToday = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d >= today;
  };

  const handlePrev = () => {
    if (!selectedDate) return;
    const prevDate = new Date(selectedDate);
    prevDate.setDate(selectedDate.getDate() - 1);
    if (isSameOrAfterToday(prevDate)) onDateChange(prevDate);
  };

  const handleNext = () => {
    if (!selectedDate) return;
    const nextDate = new Date(selectedDate);
    nextDate.setDate(selectedDate.getDate() + 1);
    onDateChange(nextDate);
  };

  const getAvailableDates = () => {
    const dates = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 30; i += 1) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }

    return dates;
  };

  const availableDates = getAvailableDates();

  const ChevronLeft = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M12.78 15.53a.75.75 0 0 1-1.06 0l-5-5a.75.75 0 0 1 0-1.06l5-5a.75.75 0 1 1 1.06 1.06L8.31 10l4.47 4.47a.75.75 0 0 1 0 1.06Z"
        clipRule="evenodd"
      />
    </svg>
  );

  const ChevronRight = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M7.22 4.47a.75.75 0 0 1 1.06 0l5 5a.75.75 0 0 1 0 1.06l-5 5a.75.75 0 0 1-1.06-1.06L11.69 10 7.22 5.53a.75.75 0 0 1 0-1.06Z"
        clipRule="evenodd"
      />
    </svg>
  );

  const ChevronDown = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 11.17l3.71-3.94a.75.75 0 1 1 1.08 1.04l-4.25 4.5a.75.75 0 0 1-1.08 0l-4.25-4.5a.75.75 0 0 1 .02-1.06Z"
        clipRule="evenodd"
      />
    </svg>
  );

  const CalendarIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
      <path d="M6 2a.75.75 0 0 1 .75.75V4h6.5V2.75a.75.75 0 0 1 1.5 0V4h.75A2.5 2.5 0 0 1 18 6.5v8A2.5 2.5 0 0 1 15.5 17h-11A2.5 2.5 0 0 1 2 14.5v-8A2.5 2.5 0 0 1 4.5 4h.75V2.75A.75.75 0 0 1 6 2Z" />
    </svg>
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between py-2 px-2 rounded-lg border border-zinc-300 bg-white">
        <button
          type="button"
          onClick={handlePrev}
          disabled={selectedDate ? isToday(selectedDate) : true}
          className={`inline-flex h-8 w-8 items-center justify-center rounded-md border transition ${
            selectedDate && isToday(selectedDate)
              ? 'text-zinc-300 border-zinc-200 cursor-not-allowed'
              : 'text-zinc-600 border-zinc-200 hover:bg-zinc-50 hover:text-zinc-900'
          }`}
        >
          <ChevronLeft />
        </button>

        <button
          type="button"
          className="flex items-center justify-center min-w-0 flex-1"
          onClick={() => setShowDateList(!showDateList)}
        >
          <div className="inline-flex items-center gap-2 rounded-md px-2 py-1 hover:bg-zinc-50">
            <span className="text-sky-700"><CalendarIcon /></span>
            <p className="font-semibold">{selectedDate ? formatDate(selectedDate) : 'Select Date'}</p>
            <span className="text-zinc-500"><ChevronDown /></span>
          </div>
        </button>

        <button
          type="button"
          onClick={handleNext}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-200 text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900 transition"
        >
          <ChevronRight />
        </button>
      </div>

      {showDateList && (
        <div className="border-2 border-zinc-200 rounded-md p-2 bg-white max-h-64 overflow-y-auto">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {availableDates.map((date) => (
              <button
                key={date.toISOString()}
                type="button"
                onClick={() => {
                  onDateChange(date);
                  setShowDateList(false);
                }}
                className={`p-2.5 rounded-sm border-2 transition-all text-center text-sm font-medium ${
                  selectedDate && date.toDateString() === selectedDate.toDateString()
                    ? 'bg-sky-600 border-sky-600 text-white'
                    : 'border-zinc-200 hover:border-sky-400 hover:bg-sky-50 text-zinc-700'
                }`}
              >
                <div className="text-xs font-semibold">
                  {date.toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
                <div className="text-sm">{date.getDate()}</div>
                <div className="text-xs text-current opacity-80">
                  {date.toLocaleDateString('en-US', { month: 'short' })}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DateSelector;
