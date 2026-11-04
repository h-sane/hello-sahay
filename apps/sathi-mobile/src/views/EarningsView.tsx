import React, { useState } from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  Clock,
  Download,
  IndianRupee,
  Info,
  Receipt,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { EarningsData } from '../types';

interface EarningsViewProps {
  earnings: EarningsData;
}

export const EarningsView: React.FC<EarningsViewProps> = ({ earnings }) => {
  const [filter, setFilter] = useState<'all' | 'paid' | 'pending'>('all');

  const isPaid = (status: string) => {
    const s = (status || '').toLowerCase();
    return s === 'completed' || s === 'paid' || s === 'settled';
  };

  const isPending = (status: string) => {
    const s = (status || '').toLowerCase();
    return s === 'pending' || s === 'in_progress' || s === 'upcoming' || s === 'due';
  };

  const filteredTransactions = earnings.transactions.filter((t) => {
    if (filter === 'paid') return isPaid(t.payment_status);
    if (filter === 'pending') return isPending(t.payment_status);
    return true;
  });

  return (
    <div className="p-4 space-y-4 max-w-md mx-auto">
      {/* Title */}
      <div>
        <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">
          Earnings & Payments
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Track service payments, payouts and live transaction history
        </p>
      </div>

      {/* Main Total Earnings Card */}
      <div className="p-5 rounded-3xl bg-[#274236] text-white shadow-md relative overflow-hidden">
        <div className="flex items-center justify-between text-xs text-[#E8F1EC]/80">
          <span className="font-semibold uppercase tracking-wider">Total Earnings</span>
          <span className="flex items-center gap-1 font-bold bg-white/10 px-2.5 py-0.5 rounded-full text-white">
            <Wallet className="w-3.5 h-3.5 text-[#E8F1EC]" /> Settled
          </span>
        </div>

        <div className="mt-2 flex items-baseline gap-1">
          <IndianRupee className="w-6 h-6 self-center text-[#E8F1EC]" />
          <span className="text-3xl font-extrabold tracking-tight">
            {earnings.total_earnings.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>

        <div className="mt-4 pt-4 border-t border-white/15 grid grid-cols-2 gap-3 text-xs">
          <div>
            <span className="text-white/70 block">This Week</span>
            <span className="text-sm font-bold text-white">
              ₹{earnings.weekly_earnings.toFixed(2)}
            </span>
          </div>
          <div>
            <span className="text-white/70 block">This Month</span>
            <span className="text-sm font-bold text-white">
              ₹{earnings.monthly_earnings.toFixed(2)}
            </span>
          </div>
        </div>
      </div>

      {/* Today and Pending Metric Cards */}
      <div className="grid grid-cols-2 gap-3">
        {/* Today's Earnings */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600">Earned Today</span>
            <div className="w-6 h-6 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-[#274236] mt-1.5">
            ₹{earnings.today_earnings.toFixed(2)}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">Completed services today</p>
        </div>

        {/* Pending Earnings */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-800">Pending</span>
            <div className="w-6 h-6 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5" />
            </div>
          </div>
          <p className="text-2xl font-extrabold text-amber-700 mt-1.5">
            ₹{earnings.pending_earnings.toFixed(2)}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {earnings.pending_earnings > 0 ? 'Active in-progress task' : 'No tasks in progress'}
          </p>
        </div>
      </div>

      {/* Transaction History Section */}
      <div className="space-y-3 pt-1">
        <div className="flex items-center justify-between px-1">
          <div>
            <h2 className="text-sm font-bold text-slate-900">Transaction History</h2>
            <span className="text-[11px] text-slate-400">
              {filteredTransactions.length} transaction{filteredTransactions.length === 1 ? '' : 's'}
            </span>
          </div>

          {/* Filter Pills: All, Paid, Pending */}
          <div className="flex gap-1 bg-slate-200/70 p-1 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-lg transition-all ${
                filter === 'all'
                  ? 'bg-white text-[#274236] font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setFilter('paid')}
              className={`px-3 py-1 rounded-lg transition-all ${
                filter === 'paid'
                  ? 'bg-[#274236] text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Paid
            </button>
            <button
              type="button"
              onClick={() => setFilter('pending')}
              className={`px-3 py-1 rounded-lg transition-all ${
                filter === 'pending'
                  ? 'bg-amber-600 text-white font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pending
            </button>
          </div>
        </div>

        {filteredTransactions.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center">
            <Receipt className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-700">No {filter} transactions found</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {filter === 'paid'
                ? 'Complete your upcoming services to receive payments.'
                : 'All current service payments have been cleared.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredTransactions.map((t) => {
              const paid = isPaid(t.payment_status);

              return (
                <div
                  key={t.id}
                  className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-xs flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                        paid
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                          : 'bg-amber-50 text-amber-700 border border-amber-200/60'
                      }`}
                    >
                      {paid ? (
                        <ArrowDownRight className="w-5 h-5" />
                      ) : (
                        <Clock className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-900 leading-snug">
                        {t.service_name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mt-0.5">
                        <span className="font-mono font-semibold text-slate-600">{t.booking_ref}</span>
                        <span>•</span>
                        <span>{t.date}</span>
                        <span>•</span>
                        <span className="capitalize font-medium">{t.payment_method || 'Cash'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-sm font-extrabold text-slate-900 block">
                      +₹{t.amount.toFixed(2)}
                    </span>
                    <div className="mt-1">
                      <span
                        className={`inline-block text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          paid
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-100 text-amber-800 border border-amber-200'
                        }`}
                      >
                        {paid ? 'PAID' : 'PENDING'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
