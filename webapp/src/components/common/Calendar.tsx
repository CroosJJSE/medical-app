// src/components/common/Calendar.tsx
import React, { useState, useMemo } from 'react';

interface CalendarProps {
  selectedDates?: Date[];
  onDateSelect: (date: Date) => void;
  minDate?: Date;
  maxSelections?: number;
}

const Calendar: React.FC<CalendarProps> = ({
  selectedDates = [],
  onDateSelect,
  minDate,
  maxSelections,
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  // Normalize date to start of day for consistent comparison
  const normalizeDate = (date: Date): Date => {
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
  };

  // Check if a date is selected
  const isDateSelected = (date: Date): boolean => {
    const normalized = normalizeDate(date);
    return selectedDates.some(d => {
      const normalizedD = normalizeDate(d);
      return normalizedD.getTime() === normalized.getTime();
    });
  };

  // Check if a date is disabled
  const isDateDisabled = (date: Date): boolean => {
    if (minDate) {
      const normalizedMin = normalizeDate(minDate);
      const normalized = normalizeDate(date);
      return normalized.getTime() < normalizedMin.getTime();
    }
    return false;
  };

  // Get days in month
  const daysInMonth = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days: (Date | null)[] = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  }, [currentMonth]);

  const handleDateClick = (date: Date | null) => {
    if (!date) return;
    
    if (isDateDisabled(date)) return;
    
    const normalized = normalizeDate(date);
    const isSelected = isDateSelected(date);
    
    if (isSelected) {
      // Deselect the date
      onDateSelect(date);
    } else {
      // Check max selections
      if (maxSelections && selectedDates.length >= maxSelections) {
        return;
      }
      // Select the date
      onDateSelect(date);
    }
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <button
          onClick={goToPreviousMonth}
          className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
          type="button"
        >
          <span className="material-symbols-outlined text-[20px] text-gray-600">chevron_left</span>
        </button>
        <h3 className="text-base font-bold text-gray-900">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>
        <button
          onClick={goToNextMonth}
          className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
          type="button"
        >
          <span className="material-symbols-outlined text-[20px] text-gray-600">chevron_right</span>
        </button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 border-b border-gray-200">
        {dayNames.map(day => (
          <div
            key={day}
            className="p-2 text-center text-xs font-bold text-gray-500 uppercase bg-gray-50"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {daysInMonth.map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} className="aspect-square p-2" />;
          }

          const selected = isDateSelected(date);
          const disabled = isDateDisabled(date);
          const isToday = normalizeDate(date).getTime() === normalizeDate(new Date()).getTime();

          return (
            <button
              key={date.toISOString()}
              onClick={() => handleDateClick(date)}
              disabled={disabled}
              className={`
                aspect-square p-2 text-sm font-medium transition-colors
                ${disabled
                  ? 'text-gray-300 cursor-not-allowed'
                  : selected
                  ? 'bg-primary text-white rounded-lg font-bold'
                  : isToday
                  ? 'text-primary hover:bg-primary/10 rounded-lg'
                  : 'text-gray-700 hover:bg-gray-100 rounded-lg'
                }
              `}
              type="button"
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Calendar;
