import React, { useState } from 'react';
import {
  Calendar as CalendarIcon,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Info,
  Loader2,
  MapPin,
  Save,
  User,
} from 'lucide-react';
import { AvailabilityData, ServiceBooking } from '../types';

interface CalendarViewProps {
  bookings: ServiceBooking[];
  availability: AvailabilityData;
  onUpdateAvailability: (data: Partial<AvailabilityData>) => Promise<void>;
  onOpenBooking: (b: ServiceBooking) => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  bookings,
  availability,
  onUpdateAvailability,
  onOpenBooking,
}) => {
  const today = new Date();
  const todayIso = today.toISOString().split('T')[0];

  const [selectedDate, setSelectedDate] = useState<string>(todayIso);
  const [currentYear, setCurrentYear] = useState<number>(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(today.getMonth()); // 0-indexed

  const [workingDays, setWorkingDays] = useState<string[]>(
    availability.working_days || ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  );
  const [startTime, setStartTime] = useState<string>(
    availability.working_hours_start || '08:00'
  );
  const [endTime, setEndTime] = useState<string>(
    availability.working_hours_end || '19:00'
  );
  const [unavailableDates, setUnavailableDates] = useState<string[]>(
    availability.unavailable_dates || []
  );
  const [busy, setBusy] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const handleGoToday = () => {
    const now = new Date();
    setCurrentYear(now.getFullYear());
    setCurrentMonth(now.getMonth());
    setSelectedDate(todayIso);
  };

  const toggleDay = (day: string) => {
    if (workingDays.includes(day)) {
      setWorkingDays(workingDays.filter((d) => d !== day));
    } else {
      setWorkingDays([...workingDays, day]);
    }
  };

  const toggleUnavailableDate = (dateStr: string) => {
    if (unavailableDates.includes(dateStr)) {
      setUnavailableDates(unavailableDates.filter((d) => d !== dateStr));
    } else {
      setUnavailableDates([...unavailableDates, dateStr]);
    }
  };

  const handleSaveAvailability = async () => {
    setBusy(true);
    setSavedSuccess(false);
    try {
      await onUpdateAvailability({
        working_days: workingDays,
        working_hours_start: startTime,
        working_hours_end: endTime,
        unavailable_dates: unavailableDates,
      });
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    } finally {
      setBusy(false);
    }
  };

  // Month Grid Calculation (Monday = index 0)
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
  const startDayIndex = (firstDayOfMonth.getDay() + 6) % 7; // Monday = 0
  const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(currentYear, currentMonth, 0).getDate();

  const calendarDays: Array<{
    dayNumber: number;
    isoDate: string;
    isCurrentMonth: boolean;
    isToday: boolean;
    isSelected: boolean;
    hasBookings: boolean;
    isUnavailable: boolean;
  }> = [];

  // Previous month trailing days
  for (let i = startDayIndex - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const prevDate = new Date(currentYear, currentMonth - 1, day);
    const iso = prevDate.toISOString().split('T')[0];
    calendarDays.push({
      dayNumber: day,
      isoDate: iso,
      isCurrentMonth: false,
      isToday: iso === todayIso,
      isSelected: iso === selectedDate,
      hasBookings: bookings.some((b) => b.booking_date === iso),
      isUnavailable: unavailableDates.includes(iso),
    });
  }

  // Current month days
  for (let day = 1; day <= daysInCurrentMonth; day++) {
    const d = new Date(currentYear, currentMonth, day);
    const iso = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    calendarDays.push({
      dayNumber: day,
      isoDate: iso,
      isCurrentMonth: true,
      isToday: iso === todayIso,
      isSelected: iso === selectedDate,
      hasBookings: bookings.some((b) => b.booking_date === iso),
      isUnavailable: unavailableDates.includes(iso),
    });
  }

  // Next month leading days to complete grid (multiples of 7)
  const remainingCells = 7 - (calendarDays.length % 7);
  if (remainingCells < 7) {
    for (let day = 1; day <= remainingCells; day++) {
      const nextDate = new Date(currentYear, currentMonth + 1, day);
      const iso = nextDate.toISOString().split('T')[0];
      calendarDays.push({
        dayNumber: day,
        isoDate: iso,
        isCurrentMonth: false,
        isToday: iso === todayIso,
        isSelected: iso === selectedDate,
        hasBookings: bookings.some((b) => b.booking_date === iso),
        isUnavailable: unavailableDates.includes(iso),
      });
    }
  }

  const selectedDateBookings = bookings.filter((b) => b.booking_date === selectedDate);
  const isSelectedDateUnavailable = unavailableDates.includes(selectedDate);

  const formatSelectedDateText = () => {
    try {
      const [y, m, d] = selectedDate.split('-').map(Number);
      const dateObj = new Date(y, m - 1, d);
      return dateObj.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return selectedDate;
    }
  };

  return (
    <div className="p-4 space-y-4 max-w-md mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">
          Calendar & Schedule
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Interactive calendar, daily bookings, and working availability
        </p>
      </div>

      {/* Proper Full Month Calendar Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-4.5 shadow-xs space-y-3.5">
        {/* Calendar Month Header & Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-900">
              {monthNames[currentMonth]} {currentYear}
            </h2>
            <button
              type="button"
              onClick={handleGoToday}
              className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#E8F1EC] text-[#274236] hover:bg-[#d5e7dc] transition-colors"
            >
              Today
            </button>
          </div>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handlePrevMonth}
              aria-label="Previous Month"
              className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 active:bg-slate-100"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              aria-label="Next Month"
              className="w-8 h-8 rounded-xl border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50 active:bg-slate-100"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Day-of-Week Headers */}
        <div className="grid grid-cols-7 text-center">
          {weekDays.map((wd) => (
            <span key={wd} className="text-[11px] font-bold text-slate-400 py-1 uppercase">
              {wd}
            </span>
          ))}
        </div>

        {/* Month Dates Grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((cell, idx) => (
            <button
              key={`${cell.isoDate}-${idx}`}
              type="button"
              onClick={() => setSelectedDate(cell.isoDate)}
              className={`h-11 rounded-xl flex flex-col items-center justify-center relative transition-all ${
                cell.isSelected
                  ? 'bg-[#274236] text-white font-bold shadow-xs scale-100'
                  : cell.isCurrentMonth
                  ? cell.isUnavailable
                    ? 'bg-rose-50 text-rose-700 font-medium'
                    : 'bg-transparent text-slate-800 hover:bg-slate-100 font-medium'
                  : 'text-slate-300 bg-transparent'
              } ${cell.isToday && !cell.isSelected ? 'border border-[#274236] font-bold text-[#274236]' : ''}`}
            >
              <span className="text-xs leading-none">{cell.dayNumber}</span>

              {/* Indicator Dots */}
              <div className="flex items-center gap-0.5 mt-1 h-1.5">
                {cell.hasBookings && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      cell.isSelected ? 'bg-white' : 'bg-emerald-600'
                    }`}
                    title="Has bookings"
                  />
                )}
                {cell.isUnavailable && (
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      cell.isSelected ? 'bg-rose-200' : 'bg-rose-500'
                    }`}
                    title="Off-duty"
                  />
                )}
              </div>
            </button>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 pt-2 border-t border-slate-100 text-[10px] text-slate-500">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-600" /> Booked Work
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500" /> Day Off / Leave
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full border border-[#274236]" /> Today
          </span>
        </div>
      </div>

      {/* Selected Date Actions & Services */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div>
            <span className="text-xs font-semibold text-slate-400 block">Selected Date</span>
            <span className="text-sm font-bold text-slate-900">
              {formatSelectedDateText()}
            </span>
          </div>

          <button
            type="button"
            onClick={() => toggleUnavailableDate(selectedDate)}
            className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-colors ${
              isSelectedDateUnavailable
                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                : 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
            }`}
          >
            {isSelectedDateUnavailable ? 'Mark as Available' : 'Mark as Day Off'}
          </button>
        </div>

        {/* Bookings on this day */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800">
              Scheduled Services ({selectedDateBookings.length})
            </h3>
            {isSelectedDateUnavailable && (
              <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200/60">
                Off-Duty Day
              </span>
            )}
          </div>

          {selectedDateBookings.length === 0 ? (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-center">
              <p className="text-xs text-slate-500">No services scheduled for this date.</p>
            </div>
          ) : (
            selectedDateBookings.map((b) => (
              <div
                key={b.id}
                onClick={() => onOpenBooking(b)}
                className="p-3.5 rounded-2xl bg-[#F8FAF9] border border-slate-200/90 cursor-pointer active:scale-[0.99] transition-transform space-y-1.5 hover:border-[#274236]/30"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900">{b.service_title}</span>
                  <span className="text-xs font-extrabold text-[#274236]">₹{b.amount}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1 font-semibold text-slate-700">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    {b.customer?.name || 'Customer'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    {b.booking_time}
                  </span>
                </div>
                <div className="flex items-center gap-1 text-[11px] text-slate-500 line-clamp-1">
                  <MapPin className="w-3 h-3 text-[#274236] shrink-0" />
                  <span>{b.location_address}</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Weekly Working Days & Hours */}
      <div className="bg-white rounded-3xl border border-slate-200/90 p-4.5 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900">
          Regular Working Schedule
        </h2>

        {/* Working Days */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-2">
            Available Working Days
          </label>
          <div className="grid grid-cols-7 gap-1.5">
            {weekDays.map((day) => {
              const isSelected = workingDays.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => toggleDay(day)}
                  className={`h-9 rounded-xl text-xs font-bold transition-all ${
                    isSelected
                      ? 'bg-[#274236] text-white shadow-xs'
                      : 'bg-[#E8F1EC] text-[#274236] hover:bg-[#d5e7dc]'
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        {/* Working Hours */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Start Time
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full h-11 px-3 text-xs rounded-xl border border-slate-200 font-semibold text-slate-800 focus:outline-none focus:border-[#274236] bg-white"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              End Time
            </label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full h-11 px-3 text-xs rounded-xl border border-slate-200 font-semibold text-slate-800 focus:outline-none focus:border-[#274236] bg-white"
            />
          </div>
        </div>

        {/* Save Availability Button */}
        <button
          type="button"
          onClick={handleSaveAvailability}
          disabled={busy}
          className="w-full h-11 rounded-2xl bg-[#274236] text-white font-bold text-xs flex items-center justify-center gap-1.5 active:bg-[#1C3228] disabled:opacity-50 transition-colors shadow-xs"
        >
          {busy ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : savedSuccess ? (
            <Check className="w-4 h-4 text-emerald-300" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          {savedSuccess ? 'Preferences Saved!' : 'Save Working Schedule'}
        </button>
      </div>
    </div>
  );
};
