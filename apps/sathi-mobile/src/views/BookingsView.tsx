import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  Filter,
  MapPin,
  Play,
  Search,
  User,
  XCircle,
} from 'lucide-react';
import { BookingStatus, ServiceBooking } from '../types';

interface BookingsViewProps {
  bookings: ServiceBooking[];
  onOpenBooking: (b: ServiceBooking) => void;
  onAction: (id: number, action: 'accept' | 'reject' | 'start' | 'complete', notes?: string) => Promise<void>;
}

export const BookingsView: React.FC<BookingsViewProps> = ({
  bookings,
  onOpenBooking,
  onAction,
}) => {
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [actionBusy, setActionBusy] = useState<number | null>(null);

  const tabs: Array<{ id: string; label: string; count: number }> = [
    { id: 'all', label: 'All', count: bookings.length },
    {
      id: 'new_request',
      label: 'New Requests',
      count: bookings.filter((b) => b.status === 'new_request').length,
    },
    {
      id: 'upcoming',
      label: 'Upcoming',
      count: bookings.filter((b) => b.status === 'upcoming').length,
    },
    {
      id: 'in_progress',
      label: 'In Progress',
      count: bookings.filter((b) => b.status === 'in_progress').length,
    },
    {
      id: 'completed',
      label: 'Completed',
      count: bookings.filter((b) => b.status === 'completed').length,
    },
    {
      id: 'cancelled',
      label: 'Cancelled',
      count: bookings.filter((b) => b.status === 'cancelled' || b.status === 'rejected').length,
    },
  ];

  const filteredBookings = bookings.filter((b) => {
    if (activeTab === 'new_request' && b.status !== 'new_request') return false;
    if (activeTab === 'upcoming' && b.status !== 'upcoming') return false;
    if (activeTab === 'in_progress' && b.status !== 'in_progress') return false;
    if (activeTab === 'completed' && b.status !== 'completed') return false;
    if (activeTab === 'cancelled' && b.status !== 'cancelled' && b.status !== 'rejected') return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = b.customer?.name.toLowerCase().includes(q);
      const matchService = b.service_title.toLowerCase().includes(q);
      const matchRef = b.booking_ref.toLowerCase().includes(q);
      const matchLoc = b.location_address.toLowerCase().includes(q);
      return matchName || matchService || matchRef || matchLoc;
    }
    return true;
  });

  const handleQuickAction = async (e: React.MouseEvent, id: number, action: 'accept' | 'reject' | 'start' | 'complete') => {
    e.stopPropagation();
    setActionBusy(id);
    try {
      await onAction(id, action);
    } finally {
      setActionBusy(null);
    }
  };

  return (
    <div className="p-4 space-y-3.5 max-w-md mx-auto">
      {/* Title & Search Header */}
      <div>
        <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">
          Booking Management
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage incoming requests and work assignments
        </p>

        {/* Search input */}
        <div className="relative mt-3">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer, service or booking ID..."
            className="w-full h-10 pl-9 pr-3 text-xs bg-white rounded-xl border border-slate-300 focus:outline-none focus:border-[#1E3A2F]"
          />
        </div>
      </div>

      {/* Horizontal Tabs Scrollable */}
      <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1">
        {tabs.map((tab) => {
          const isSel = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${
                isSel
                  ? 'bg-[#1E3A2F] text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  isSel ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Bookings List */}
      <div className="space-y-3 pt-1">
        {filteredBookings.length === 0 ? (
          <div className="py-12 text-center bg-white rounded-3xl border border-slate-200 p-6">
            <Filter className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-slate-800">No bookings in this category</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
              {activeTab === 'new_request'
                ? 'When a Hello Sahay customer books your skill, new requests will appear here.'
                : 'No bookings match your current filter.'}
            </p>
          </div>
        ) : (
          filteredBookings.map((b) => {
            const statusStyle = {
              new_request: 'bg-amber-100 text-amber-900 border-amber-200',
              upcoming: 'bg-blue-100 text-blue-900 border-blue-200',
              in_progress: 'bg-emerald-100 text-emerald-900 border-emerald-200',
              completed: 'bg-slate-100 text-slate-700 border-slate-200',
              cancelled: 'bg-rose-100 text-rose-800 border-rose-200',
              rejected: 'bg-slate-100 text-slate-500 border-slate-200',
            }[b.status];

            const statusLabel = {
              new_request: 'New Request',
              upcoming: 'Upcoming',
              in_progress: 'In Progress',
              completed: 'Completed',
              cancelled: 'Cancelled',
              rejected: 'Declined',
            }[b.status];

            const isBusy = actionBusy === b.id;

            return (
              <div
                key={b.id}
                onClick={() => onOpenBooking(b)}
                className="p-4 rounded-3xl bg-white border border-slate-200/90 shadow-xs cursor-pointer active:scale-[0.99] transition-transform space-y-3"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-2 border-b border-slate-100 pb-2.5">
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-mono font-bold text-slate-400">
                        {b.booking_ref}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusStyle}`}>
                        {statusLabel}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 mt-1 leading-snug">
                      {b.service_title}
                    </h3>
                    <p className="text-[11px] font-semibold text-[#1E3A2F]">
                      {b.service_category}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-base font-extrabold text-[#1E3A2F]">
                      ₹{b.amount.toFixed(0)}
                    </span>
                    <p className="text-[10px] text-slate-400 capitalize">{b.payment_status}</p>
                  </div>
                </div>

                {/* Details info */}
                <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-semibold text-slate-800 truncate">
                      {b.customer?.name || 'Customer'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{b.booking_date}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{b.booking_time}</span>
                </div>

                <div className="flex items-start gap-1.5 text-xs text-slate-600">
                  <MapPin className="w-3.5 h-3.5 text-[#1E3A2F] shrink-0 mt-0.5" />
                  <span className="line-clamp-1">{b.location_address}</span>
                </div>

                {/* Inline Action Bar */}
                {b.status === 'new_request' && (
                  <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2">
                    <button
                      disabled={isBusy}
                      onClick={(e) => handleQuickAction(e, b.id, 'reject')}
                      className="h-9 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs flex items-center justify-center gap-1 active:bg-slate-100"
                    >
                      <XCircle className="w-3.5 h-3.5 text-slate-400" /> Decline
                    </button>
                    <button
                      disabled={isBusy}
                      onClick={(e) => handleQuickAction(e, b.id, 'accept')}
                      className="h-9 rounded-xl bg-[#1E3A2F] text-white font-bold text-xs flex items-center justify-center gap-1 active:bg-[#162C23]"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5 text-[#E8F1EC]" /> Accept
                    </button>
                  </div>
                )}

                {b.status === 'upcoming' && (
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] font-medium text-slate-500">
                      Tap for customer details
                    </span>
                    <button
                      disabled={isBusy}
                      onClick={(e) => handleQuickAction(e, b.id, 'start')}
                      className="h-8 px-3 rounded-xl bg-[#1E3A2F] text-white font-bold text-xs flex items-center gap-1 active:bg-[#162C23]"
                    >
                      <Play className="w-3 h-3 fill-white" /> Start Service
                    </button>
                  </div>
                )}

                {b.status === 'in_progress' && (
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-emerald-700 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" /> Service Active
                    </span>
                    <button
                      disabled={isBusy}
                      onClick={(e) => handleQuickAction(e, b.id, 'complete')}
                      className="h-8 px-3 rounded-xl bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 active:bg-emerald-800"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Mark Completed
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

