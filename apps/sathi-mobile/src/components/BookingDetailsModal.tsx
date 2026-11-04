import React, { useState } from 'react';
import {
  Calendar,
  CheckCircle2,
  Clock,
  ExternalLink,
  IndianRupee,
  MapPin,
  Phone,
  Play,
  User,
  X,
  XCircle,
} from 'lucide-react';
import { ServiceBooking } from '../types';

interface BookingDetailsModalProps {
  booking: ServiceBooking | null;
  isOpen: boolean;
  onClose: () => void;
  onAction: (id: number, action: 'accept' | 'reject' | 'start' | 'complete', notes?: string) => Promise<void>;
}

export const BookingDetailsModal: React.FC<BookingDetailsModalProps> = ({
  booking,
  isOpen,
  onClose,
  onAction,
}) => {
  const [busy, setBusy] = useState(false);
  const [notes, setNotes] = useState('');

  if (!isOpen || !booking) return null;

  const statusBadge = {
    new_request: 'bg-amber-50 text-amber-800 border-amber-200',
    upcoming: 'bg-blue-50 text-blue-800 border-blue-200',
    in_progress: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    completed: 'bg-slate-100 text-slate-800 border-slate-200',
    cancelled: 'bg-rose-50 text-rose-800 border-rose-200',
    rejected: 'bg-slate-100 text-slate-500 border-slate-200',
  }[booking.status];

  const statusLabel = {
    new_request: 'New Request',
    upcoming: 'Upcoming',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
    rejected: 'Rejected',
  }[booking.status];

  const handleAction = async (action: 'accept' | 'reject' | 'start' | 'complete') => {
    setBusy(true);
    try {
      await onAction(booking.id, action, notes);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.location_address)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-xs p-0 sm:p-4">
      <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-[#F8FAF9]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-500">
                {booking.booking_ref}
              </span>
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border ${statusBadge}`}>
                {statusLabel}
              </span>
            </div>
            <h3 className="text-base font-bold text-slate-900 mt-0.5 leading-snug">
              {booking.service_title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200/70 flex items-center justify-center text-slate-600 hover:text-slate-900"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4">
          {/* Customer Card */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#1E3A2F] text-white flex items-center justify-center text-sm font-bold">
                  <User className="w-4 h-4 text-[#E8F1EC]" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    {booking.customer?.name || 'Customer'}
                  </h4>
                  <p className="text-xs text-slate-500">{booking.customer?.village || 'Customer'}</p>
                </div>
              </div>
              {booking.customer?.phone && (
                <a
                  href={`tel:${booking.customer.phone}`}
                  className="h-8 px-2.5 rounded-lg bg-emerald-600 text-white flex items-center gap-1.5 text-xs font-semibold active:bg-emerald-700"
                >
                  <Phone className="w-3.5 h-3.5" /> Call
                </a>
              )}
            </div>
          </div>

          {/* Date, Time & Amount */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70">
              <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium">
                <Calendar className="w-3.5 h-3.5" /> Date
              </div>
              <p className="text-sm font-bold text-slate-900 mt-1">{booking.booking_date}</p>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70">
              <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium">
                <Clock className="w-3.5 h-3.5" /> Slot
              </div>
              <p className="text-xs font-bold text-slate-900 mt-1 leading-tight">{booking.booking_time}</p>
            </div>
          </div>

          {/* Location */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between mb-1.5">
              <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                <MapPin className="w-3.5 h-3.5 text-[#1E3A2F]" /> Service Location
              </span>
              <a
                href={mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs font-bold text-[#1E3A2F] flex items-center gap-1 hover:underline"
              >
                Maps <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed font-medium">
              {booking.location_address}
            </p>
          </div>

          {/* Service Details & Notes */}
          {booking.description && (
            <div className="p-3 rounded-2xl bg-white border border-slate-200">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Work Requirements
              </p>
              <p className="text-xs text-slate-800 leading-relaxed">{booking.description}</p>
            </div>
          )}

          {booking.customer_notes && (
            <div className="p-3 rounded-2xl bg-amber-50/60 border border-amber-200/60">
              <p className="text-xs font-semibold text-amber-800 uppercase tracking-wider mb-1">
                Customer Instructions
              </p>
              <p className="text-xs text-amber-900 leading-relaxed">{booking.customer_notes}</p>
            </div>
          )}

          {/* Fee & Payment Status */}
          <div className="p-3.5 rounded-2xl bg-[#E8F1EC]/60 border border-[#2D4A3E]/20 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-[#1E3A2F]">Estimated Earnings</span>
              <p className="text-lg font-bold text-[#1E3A2F] flex items-center">
                <IndianRupee className="w-4 h-4 inline mr-0.5" />
                {booking.amount.toFixed(2)}
              </p>
            </div>
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                booking.payment_status === 'completed'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              Payment: {booking.payment_status.toUpperCase()}
            </span>
          </div>

          {/* Optional notes on completion */}
          {(booking.status === 'in_progress' || booking.status === 'upcoming') && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Service Notes / Remarks (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Completed water filter nozzle replacement"
                className="w-full h-10 px-3 text-xs rounded-xl border border-slate-300 focus:outline-none focus:border-[#1E3A2F]"
              />
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-t border-slate-100 bg-white">
          {booking.status === 'new_request' && (
            <div className="grid grid-cols-2 gap-3">
              <button
                disabled={busy}
                onClick={() => handleAction('reject')}
                className="h-11 rounded-xl border border-slate-300 text-slate-700 font-semibold text-sm flex items-center justify-center gap-1.5 active:bg-slate-100"
              >
                <XCircle className="w-4 h-4 text-slate-500" /> Decline
              </button>
              <button
                disabled={busy}
                onClick={() => handleAction('accept')}
                className="h-11 rounded-xl bg-[#1E3A2F] text-white font-semibold text-sm flex items-center justify-center gap-1.5 active:bg-[#162C23]"
              >
                <CheckCircle2 className="w-4 h-4 text-[#E8F1EC]" /> Accept Booking
              </button>
            </div>
          )}

          {booking.status === 'upcoming' && (
            <div className="space-y-2">
              <button
                disabled={busy}
                onClick={() => handleAction('start')}
                className="w-full h-11 rounded-xl bg-[#1E3A2F] text-white font-semibold text-sm flex items-center justify-center gap-2 active:bg-[#162C23]"
              >
                <Play className="w-4 h-4 fill-white" /> Start Service Now
              </button>
            </div>
          )}

          {booking.status === 'in_progress' && (
            <button
              disabled={busy}
              onClick={() => handleAction('complete')}
              className="w-full h-11 rounded-xl bg-emerald-700 text-white font-semibold text-sm flex items-center justify-center gap-2 active:bg-emerald-800"
            >
              <CheckCircle2 className="w-4 h-4" /> Mark as Completed
            </button>
          )}

          {(booking.status === 'completed' || booking.status === 'cancelled' || booking.status === 'rejected') && (
            <button
              onClick={onClose}
              className="w-full h-11 rounded-xl bg-slate-100 text-slate-800 font-semibold text-sm"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

