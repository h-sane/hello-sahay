import React, { useState } from 'react';
import {
  ArrowRight,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  IndianRupee,
  MapPin,
  Power,
  ShieldCheck,
  TrendingUp,
  User,
  Wrench,
  X,
} from 'lucide-react';
import { EarningsData, HelperProfile, NavTab, ServiceBooking } from '../types';

interface HomeViewProps {
  profile: HelperProfile;
  bookings: ServiceBooking[];
  earnings: EarningsData;
  onToggleOnline: (online: boolean) => Promise<void>;
  onNavigate: (tab: NavTab) => void;
  onOpenBooking: (b: ServiceBooking) => void;
  onAction?: (id: number, action: 'accept' | 'reject' | 'start' | 'complete') => Promise<void>;
}

export const HomeView: React.FC<HomeViewProps> = ({
  profile,
  bookings,
  earnings,
  onToggleOnline,
  onNavigate,
  onOpenBooking,
  onAction,
}) => {
  const [toggling, setToggling] = useState(false);
  const [actionInProgress, setActionInProgress] = useState<number | null>(null);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayBookings = bookings.filter((b) => b.booking_date === todayStr && b.status !== 'cancelled');
  const upcomingBookings = bookings.filter((b) => b.status === 'upcoming' || b.status === 'new_request');
  // Exactly 2 recent activities as requested by user
  const recentBookings = bookings.slice(0, 2);

  const handleToggle = async () => {
    setToggling(true);
    try {
      await onToggleOnline(!profile.is_online);
    } finally {
      setToggling(false);
    }
  };

  const handleCardAction = async (
    e: React.MouseEvent,
    id: number,
    action: 'accept' | 'reject' | 'start' | 'complete'
  ) => {
    e.stopPropagation();
    if (!onAction) return;
    setActionInProgress(id);
    try {
      await onAction(id, action);
    } finally {
      setActionInProgress(null);
    }
  };

  return (
    <div className="p-4 space-y-4 max-w-md mx-auto">
      {/* Availability Card with Toggle */}
      <div className="p-4 rounded-3xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`w-3.5 h-3.5 rounded-full ${
              profile.is_online
                ? 'bg-emerald-500 ring-4 ring-emerald-100 animate-pulse'
                : 'bg-slate-300 ring-4 ring-slate-100'
            }`}
          />
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-bold text-slate-900">
                {profile.is_online ? 'You are Online' : 'You are Offline'}
              </span>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  profile.is_online
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {profile.is_online ? 'Ready for Work' : 'Off Duty'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {profile.is_online
                ? 'Receiving new requests from Hello Sahay'
                : 'Turn on to receive booking alerts'}
            </p>
          </div>
        </div>

        <button
          onClick={handleToggle}
          disabled={toggling}
          aria-label="Toggle Online/Offline"
          className={`h-9 px-3 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 ${
            profile.is_online
              ? 'bg-[#274236] text-white'
              : 'bg-slate-200 text-slate-700'
          }`}
        >
          <Power className="w-3.5 h-3.5" />
          {profile.is_online ? 'Go Offline' : 'Go Online'}
        </button>
      </div>

      {/* Dashboard Overview Metrics Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Today's Bookings */}
        <div
          onClick={() => onNavigate('bookings')}
          className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-xs cursor-pointer active:bg-slate-50 transition-colors"
        >
          <span className="text-xs font-semibold text-slate-500 flex items-center justify-between">
            Today's Work <Calendar className="w-3.5 h-3.5 text-[#274236]" />
          </span>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">
            {todayBookings.length}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            {todayBookings.filter((b) => b.status === 'completed').length} completed
          </p>
        </div>

        {/* Upcoming Bookings */}
        <div
          onClick={() => onNavigate('bookings')}
          className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-xs cursor-pointer active:bg-slate-50 transition-colors"
        >
          <span className="text-xs font-semibold text-slate-500 flex items-center justify-between">
            Upcoming <Clock className="w-3.5 h-3.5 text-blue-600" />
          </span>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">
            {upcomingBookings.length}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">Ready to serve</p>
        </div>

        {/* Completed Services */}
        <div
          onClick={() => onNavigate('bookings')}
          className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-xs cursor-pointer active:bg-slate-50 transition-colors"
        >
          <span className="text-xs font-semibold text-slate-500 flex items-center justify-between">
            Completed <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          </span>
          <p className="text-2xl font-extrabold text-slate-900 mt-1">
            {profile.completed_count}
          </p>
          <p className="text-[11px] text-emerald-600 font-medium mt-0.5">★ {profile.rating} Rating</p>
        </div>

        {/* Total Earnings */}
        <div
          onClick={() => onNavigate('earnings')}
          className="p-3.5 rounded-2xl bg-[#E8F1EC] border border-[#274236]/20 shadow-xs cursor-pointer active:bg-[#d8e8de] transition-colors"
        >
          <span className="text-xs font-bold text-[#274236] flex items-center justify-between">
            Total Earnings <TrendingUp className="w-3.5 h-3.5 text-[#274236]" />
          </span>
          <p className="text-2xl font-extrabold text-[#274236] mt-1 flex items-center">
            <IndianRupee className="w-4 h-4 inline mr-0.5" />
            {earnings.total_earnings.toFixed(0)}
          </p>
          <p className="text-[11px] text-[#274236]/80 mt-0.5 font-medium">
            ₹{earnings.weekly_earnings.toFixed(0)} this week
          </p>
        </div>
      </div>

      {/* Recent Booking Activity (limited to 2 items and dynamically updates on any action) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Recent Service Activity</h2>
            <span className="text-[10px] text-slate-400">Latest 2 recent jobs</span>
          </div>
          <button
            onClick={() => onNavigate('bookings')}
            className="text-xs font-bold text-[#274236] hover:underline flex items-center gap-0.5"
          >
            View All ({bookings.length}) <ArrowRight className="w-3 h-3" />
          </button>
        </div>

        {recentBookings.length === 0 ? (
          <div className="p-6 rounded-2xl bg-white border border-slate-200 text-center">
            <p className="text-xs text-slate-500">No recent activity yet.</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {recentBookings.map((b) => {
              const statusStyle = {
                new_request: 'bg-amber-100 text-amber-900 border border-amber-200',
                upcoming: 'bg-blue-100 text-blue-900 border border-blue-200',
                in_progress: 'bg-emerald-100 text-emerald-900 border border-emerald-200',
                completed: 'bg-slate-100 text-slate-700 border border-slate-200',
                cancelled: 'bg-rose-100 text-rose-900 border border-rose-200',
                rejected: 'bg-slate-100 text-slate-500 border border-slate-200',
              }[b.status];

              const statusLabel = {
                new_request: 'New Request',
                upcoming: 'Upcoming',
                in_progress: 'In Progress',
                completed: 'Completed',
                cancelled: 'Cancelled',
                rejected: 'Declined',
              }[b.status];

              const isBusy = actionInProgress === b.id;

              return (
                <div
                  key={b.id}
                  onClick={() => onOpenBooking(b)}
                  className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs cursor-pointer active:scale-[0.99] transition-transform"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono font-bold text-slate-400">
                          {b.booking_ref}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${statusStyle}`}>
                          {statusLabel}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 mt-1 leading-snug">
                        {b.service_title}
                      </h3>
                    </div>
                    <span className="text-sm font-extrabold text-[#274236] shrink-0">
                      ₹{b.amount.toFixed(0)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                    <span className="flex items-center gap-1 font-medium text-slate-700">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {b.customer?.name || 'Customer'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {b.booking_time}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 mt-1.5 text-xs text-slate-600 line-clamp-1">
                    <MapPin className="w-3 h-3 text-[#274236] shrink-0" />
                    <span>{b.location_address}</span>
                  </div>

                  {/* Dynamic Action Buttons on Card */}
                  {onAction && b.status === 'new_request' && (
                    <div className="flex gap-2 mt-3 pt-2.5 border-t border-slate-100">
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={(e) => handleCardAction(e, b.id, 'accept')}
                        className="flex-1 h-9 rounded-xl bg-[#274236] text-white text-xs font-bold flex items-center justify-center gap-1.5 active:bg-[#1C3228] disabled:opacity-50 transition-colors shadow-xs"
                      >
                        <Check className="w-3.5 h-3.5" />
                        {isBusy ? 'Updating...' : 'Accept Work'}
                      </button>
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={(e) => handleCardAction(e, b.id, 'reject')}
                        className="px-3.5 h-9 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50 disabled:opacity-50"
                      >
                        Decline
                      </button>
                    </div>
                  )}

                  {onAction && b.status === 'upcoming' && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100">
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={(e) => handleCardAction(e, b.id, 'start')}
                        className="w-full h-9 rounded-xl bg-[#274236] text-white text-xs font-bold flex items-center justify-center gap-1.5 active:bg-[#1C3228] disabled:opacity-50 transition-colors shadow-xs"
                      >
                        <Clock className="w-3.5 h-3.5" />
                        {isBusy ? 'Starting...' : 'Start Service'}
                      </button>
                    </div>
                  )}

                  {onAction && b.status === 'in_progress' && (
                    <div className="mt-3 pt-2.5 border-t border-slate-100">
                      <button
                        type="button"
                        disabled={isBusy}
                        onClick={(e) => handleCardAction(e, b.id, 'complete')}
                        className="w-full h-9 rounded-xl bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 active:bg-emerald-800 disabled:opacity-50 transition-colors shadow-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {isBusy ? 'Completing...' : 'Mark as Completed'}
                      </button>
                    </div>
                  )}

                  {b.status === 'completed' && (
                    <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-emerald-800 font-medium">
                      <span className="flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Service Completed
                      </span>
                      <span className="font-semibold">Payment Settled</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Verified Skills Summary Banner */}
      <div className="p-4 rounded-3xl bg-white border border-slate-200/90 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-[#274236]" />
            <span className="text-xs font-bold text-slate-800">Your Active Skills</span>
          </div>
          <button
            onClick={() => onNavigate('profile')}
            className="text-[11px] font-bold text-[#274236] hover:underline"
          >
            Manage
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {profile.skills.slice(0, 4).map((s) => (
            <span
              key={s}
              className="px-2.5 py-1 rounded-full bg-[#E8F1EC] text-[#274236] text-[11px] font-medium"
            >
              {s}
            </span>
          ))}
          {profile.skills.length > 4 && (
            <span className="px-2 py-1 rounded-full bg-slate-100 text-slate-500 text-[11px] font-medium">
              +{profile.skills.length - 4} more
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
