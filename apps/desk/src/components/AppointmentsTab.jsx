import { useState } from "react";
import {
  Search,
  CalendarCheck,
  CheckCircle2,
  Clock,
} from "lucide-react";

// ─── Status Button ───────────────────────────────────
// Front desk marks arrival (or no-show); the doctor or the front desk calls the patient in and finishes the visit.
function StatusButton({ status, isDoctor, onArrive, onStart, onDone, onNoShow }) {
  const idle = "bg-slate-100 text-slate-400 cursor-default";
  if (status === "Booked") {
    if (isDoctor) {
      return <span className={`px-5 py-2.5 rounded-xl text-base font-bold ${idle}`}>Not arrived</span>;
    }
    return (
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={onArrive}
          className="px-5 py-2.5 rounded-xl text-base font-bold transition-colors bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
        >
          Mark Arrived
        </button>
        <button
          onClick={onNoShow}
          className="px-3.5 py-2.5 rounded-xl text-base font-bold text-slate-600 hover:text-rose-700 hover:bg-rose-50 border border-slate-200 transition-colors"
        >
          No-show
        </button>
      </div>
    );
  }
  if (status === "Arrived") {
    return (
      <button
        onClick={onStart}
        className="px-5 py-2.5 rounded-xl text-base font-bold transition-colors bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
      >
        Call in
      </button>
    );
  }
  if (status === "With doctor") {
    return (
      <button
        onClick={onDone}
        className="px-5 py-2.5 rounded-xl text-base font-bold transition-colors bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
      >
        Mark Done
      </button>
    );
  }
  const label = { Completed: "Done ✓", Cancelled: "Cancelled", "No-show": "No-show" }[status];
  return <span className={`px-5 py-2.5 rounded-xl text-base font-bold ${idle}`}>{label}</span>;
}

const SOURCE = { helpline: "Helpline", app: "Patient app", desk: "Front desk" };

function StatusDot({ status }) {
  const color = {
    Booked: "bg-blue-500",
    Arrived: "bg-amber-500",
    "With doctor": "bg-indigo-500",
    Completed: "bg-emerald-500",
    Cancelled: "bg-slate-400",
    "No-show": "bg-rose-500",
  };
  const badgeCls = {
    Booked: "bg-blue-50 text-blue-800 border-blue-200",
    Arrived: "bg-amber-50 text-amber-800 border-amber-200",
    "With doctor": "bg-indigo-50 text-indigo-800 border-indigo-200",
    Completed: "bg-emerald-50 text-emerald-800 border-emerald-200",
    Cancelled: "bg-slate-50 text-slate-600 border-slate-200",
    "No-show": "bg-rose-50 text-rose-800 border-rose-200",
  };
  return (
    <span
      className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-base font-bold border ${badgeCls[status]}`}
    >
      <span className={`w-3 h-3 rounded-full ${color[status]}`} />
      {status}
    </span>
  );
}

// ─── Main Component ──────────────────────────────────
export default function AppointmentsTab({
  appointments,
  doctors,
  isDoctor,
  onArrive,
  onDone,
  onNoShow,
  onStart,
}) {
  const [search, setSearch] = useState("");

  const active = appointments.filter(
    (a) => a.status !== "Cancelled" && a.status !== "No-show"
  );
  const total = active.length;
  const waitingCount = active.filter(
    (a) => a.status === "Booked" || a.status === "Arrived" || a.status === "With doctor"
  ).length;
  const completedCount = active.filter((a) => a.status === "Completed").length;

  const filtered = appointments.filter((a) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return a.patientName.toLowerCase().includes(q) || a.phone.includes(q);
  });

  return (
    <div className="space-y-6">
      {/* ── Top Summary Row: 3 Specific Stat Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex items-center gap-5 shadow-sm">
          <div className="p-4 rounded-xl bg-blue-50 ring-1 ring-blue-100 text-blue-600 shrink-0">
            <CalendarCheck className="w-8 h-8" />
          </div>
          <div>
            <p className="text-4xl font-black text-slate-900">{total}</p>
            <p className="text-base font-bold text-slate-600 mt-0.5">
              Total Appointments
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex items-center gap-5 shadow-sm">
          <div className="p-4 rounded-xl bg-amber-50 ring-1 ring-amber-100 text-amber-600 shrink-0">
            <Clock className="w-8 h-8" />
          </div>
          <div>
            <p className="text-4xl font-black text-slate-900">{waitingCount}</p>
            <p className="text-base font-bold text-slate-600 mt-0.5">
              Waiting / In Queue
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 flex items-center gap-5 shadow-sm">
          <div className="p-4 rounded-xl bg-emerald-50 ring-1 ring-emerald-100 text-emerald-600 shrink-0">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <p className="text-4xl font-black text-slate-900">
              {completedCount}
            </p>
            <p className="text-base font-bold text-slate-600 mt-0.5">
              Completed
            </p>
          </div>
        </div>
      </div>

      {/* ── Search Bar ── */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400" />
          <input
            type="text"
            placeholder="Search patient name or phone number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 border border-slate-300 rounded-xl text-lg font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

      </div>

      {/* ── Appointments Table (High-contrast, Large Font, py-4 px-5) ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200">
                <th className="text-left py-4 px-5 text-sm font-black text-slate-700 uppercase tracking-wider">
                  No.
                </th>
                <th className="text-left py-4 px-5 text-sm font-black text-slate-700 uppercase tracking-wider">
                  Patient Details
                </th>
                <th className="text-left py-4 px-5 text-sm font-black text-slate-700 uppercase tracking-wider">
                  Assigned Doctor & Dept
                </th>
                <th className="text-left py-4 px-5 text-sm font-black text-slate-700 uppercase tracking-wider">
                  Time Slot
                </th>
                <th className="text-left py-4 px-5 text-sm font-black text-slate-700 uppercase tracking-wider">
                  Status
                </th>
                <th className="text-left py-4 px-5 text-sm font-black text-slate-700 uppercase tracking-wider">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filtered.map((appt) => (
                <tr
                  key={appt.id}
                  className={`hover:bg-slate-50 transition-colors ${
                    appt.status === "Arrived" ? "bg-amber-50/20" : ""
                  }`}
                >
                  {/* Token */}
                  <td className="py-4 px-5 font-mono text-xl font-black text-blue-700">
                    {appt.token}
                  </td>

                  {/* Patient Name, Age, Phone */}
                  <td className="py-4 px-5">
                    <div className="text-lg font-bold text-slate-900">
                      {appt.patientName}
                    </div>
                    <div className="text-base font-semibold text-slate-500 font-mono mt-0.5">
                      {appt.phone}
                    </div>
                    <div className="text-sm text-slate-500 mt-1">
                      <span className="font-bold text-slate-600">{SOURCE[appt.source] || appt.source}</span>
                      {appt.language ? ` · ${appt.language}` : ""}
                      {appt.reason ? ` · ${appt.reason}` : ""}
                    </div>
                  </td>

                  {/* Doctor & Dept */}
                  <td className="py-4 px-5">
                    <div className="text-lg font-bold text-slate-900">
                      {appt.doctor}
                    </div>
                    <div className="text-base font-medium text-slate-600 mt-0.5">
                      {appt.department}
                    </div>
                  </td>

                  {/* Time Slot */}
                  <td className="py-4 px-5 text-lg font-semibold text-slate-800">
                    {appt.timeSlot}
                  </td>

                  {/* Status Badge */}
                  <td className="py-4 px-5">
                    <StatusDot status={appt.status} />
                  </td>

                  {/* Action Button */}
                  <td className="py-4 px-5">
                    <StatusButton
                      status={appt.status}
                      isDoctor={isDoctor}
                      onArrive={() => onArrive(appt.id)}
                      onStart={() => onStart(appt.id)}
                      onDone={() => onDone(appt.id)}
                      onNoShow={() => onNoShow(appt.id)}
                    />
                  </td>
                </tr>
              ))}

              {filtered.length === 0 && (
                <tr>
                  <td
                    colSpan={6}
                    className="py-12 px-5 text-center text-lg font-medium text-slate-500"
                  >
                    {search
                      ? `No appointments match "${search}".`
                      : "No appointments on this day. Bookings from the helpline and the patient app appear here live."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
