import { useState } from "react";
import {
  Search,
  Plus,
  X,
  CalendarCheck,
  Users,
  CheckCircle2,
  Clock,
  ArrowRight,
  UserCheck,
  PhoneCall,
} from "lucide-react";

// ─── Status Button ───────────────────────────────────
function StatusButton({ status, onClick }) {
  const config = {
    Booked: {
      label: "Mark Arrived",
      cls: "bg-blue-600 hover:bg-blue-700 text-white shadow-sm",
    },
    Arrived: {
      label: "Mark Completed",
      cls: "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm",
    },
    Completed: {
      label: "Completed ✓",
      cls: "bg-slate-100 text-slate-400 cursor-default",
    },
  };
  const c = config[status];
  return (
    <button
      onClick={status !== "Completed" ? onClick : undefined}
      className={`px-5 py-2.5 rounded-xl text-base font-bold transition-colors ${c.cls}`}
    >
      {c.label}
    </button>
  );
}

function StatusDot({ status }) {
  const color = {
    Booked: "bg-blue-500",
    Arrived: "bg-amber-500",
    Completed: "bg-emerald-500",
  };
  const badgeCls = {
    Booked: "bg-blue-50 text-blue-800 border-blue-200",
    Arrived: "bg-amber-50 text-amber-800 border-amber-200",
    Completed: "bg-emerald-50 text-emerald-800 border-emerald-200",
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
  setAppointments,
  doctors,
}) {
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    name: "",
    age: "",
    phone: "",
    doctor: "",
    timeSlot: "11:30 AM",
  });

  // ── Stats ──
  const total = appointments.length;
  const waitingCount = appointments.filter(
    (a) => a.status === "Booked" || a.status === "Arrived"
  ).length;
  const completedCount = appointments.filter(
    (a) => a.status === "Completed"
  ).length;

  // ── Active Patient for "Now Serving" banner ──
  // Prioritize first "Arrived" patient; if none, take first "Booked"
  const currentServing =
    appointments.find((a) => a.status === "Arrived") ||
    appointments.find((a) => a.status === "Booked");

  // ── 1-Click "Complete & Call Next" Handler ──
  const handleCompleteAndNext = () => {
    if (!currentServing) return;

    setAppointments((prev) => {
      let completedCurrent = false;
      let nextCalled = false;

      return prev.map((a) => {
        // Mark current active patient as Completed
        if (a.id === currentServing.id) {
          completedCurrent = true;
          return { ...a, status: "Completed" };
        }
        // Advance the next Booked patient to Arrived if there was no other Arrived patient
        if (
          completedCurrent &&
          !nextCalled &&
          a.status === "Booked"
        ) {
          nextCalled = true;
          return { ...a, status: "Arrived" };
        }
        return a;
      });
    });
  };

  // ── Filter — Patient Search ──
  const filtered = appointments.filter((a) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return a.patientName.toLowerCase().includes(q) || a.phone.includes(q);
  });

  // ── Toggle Status ──
  const toggleStatus = (id) => {
    setAppointments((prev) =>
      prev.map((a) => {
        if (a.id !== id) return a;
        const next = {
          Booked: "Arrived",
          Arrived: "Completed",
          Completed: "Completed",
        };
        return { ...a, status: next[a.status] };
      })
    );
  };

  // ── Add Walk-In ──
  const handleAddWalkIn = () => {
    if (!form.name.trim() || !form.phone.trim() || !form.doctor) return;
    const doc = doctors.find((d) => d.name === form.doctor);
    const newAppt = {
      id: Date.now(),
      token:
        appointments.length > 0
          ? Math.max(...appointments.map((a) => a.token)) + 1
          : 101,
      patientName: form.name.trim(),
      age: form.age ? parseInt(form.age, 10) : 35,
      phone: form.phone.trim(),
      doctor: form.doctor,
      department: doc?.specialty || "General Medicine",
      timeSlot: form.timeSlot || "Now",
      status: "Arrived", // Walk-in is already at the clinic!
    };
    setAppointments((prev) => [...prev, newAppt]);
    setShowModal(false);
    setForm({
      name: "",
      age: "",
      phone: "",
      doctor: "",
      timeSlot: "11:30 AM",
    });
  };

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
              Completed Today
            </p>
          </div>
        </div>
      </div>

      {/* ── Active Queue / Now Serving Banner ── */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-white rounded-2xl border-2 border-blue-200 p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="flex items-start gap-4">
            <div className="p-3.5 rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-200 shrink-0 mt-1">
              <UserCheck className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-black uppercase tracking-wider px-2.5 py-1 rounded-md bg-blue-600 text-white">
                  Active Queue
                </span>
                <span className="text-base font-semibold text-slate-500">
                  Current Consultation
                </span>
              </div>

              {currentServing ? (
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-2xl font-black text-blue-700 font-mono">
                      Token #{currentServing.token}
                    </span>
                    <span className="text-2xl font-black text-slate-900">
                      {currentServing.patientName}
                    </span>
                    <span className="text-lg font-medium text-slate-500">
                      ({currentServing.age} yrs · {currentServing.phone})
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mt-1.5 text-base text-slate-700">
                    <span className="font-bold text-slate-800">
                      Doctor: {currentServing.doctor}
                    </span>
                    <span>·</span>
                    <span className="text-slate-600">
                      Dept: {currentServing.department}
                    </span>
                    <span>·</span>
                    <span className="text-slate-600 font-medium">
                      Slot: {currentServing.timeSlot}
                    </span>
                    <span>·</span>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        currentServing.status === "Arrived"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-blue-100 text-blue-800"
                      }`}
                    >
                      {currentServing.status === "Arrived"
                        ? "Waiting in Reception"
                        : "Booked (Scheduled)"}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-xl font-bold text-emerald-700 mt-1">
                  Queue is clear! All scheduled patients have been completed.
                </div>
              )}
            </div>
          </div>

          {currentServing && (
            <button
              onClick={handleCompleteAndNext}
              className="w-full lg:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white text-lg font-bold rounded-xl shadow-md shadow-blue-200 transition-all shrink-0"
            >
              Complete & Call Next
              <ArrowRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* ── Search Bar & Add Walk-In ── */}
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

        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-lg font-bold rounded-xl shadow-sm transition-colors shrink-0"
        >
          <Plus className="w-6 h-6" />
          + Add Walk-In Patient
        </button>
      </div>

      {/* ── Appointments Table (High-contrast, Large Font, py-4 px-5) ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200">
                <th className="text-left py-4 px-5 text-sm font-black text-slate-700 uppercase tracking-wider">
                  Token
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
                    #{appt.token}
                  </td>

                  {/* Patient Name, Age, Phone */}
                  <td className="py-4 px-5">
                    <div className="text-lg font-bold text-slate-900">
                      {appt.patientName}
                      <span className="text-base font-semibold text-slate-500 ml-2">
                        ({appt.age} yrs)
                      </span>
                    </div>
                    <div className="text-base font-semibold text-slate-500 font-mono mt-0.5">
                      {appt.phone}
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
                      onClick={() => toggleStatus(appt.id)}
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
                    No appointments found matching "{search}".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Walk-In Modal (Clean 5 Fields: Name, Age, Phone, Doctor, Time Slot) ── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-slate-50">
              <div>
                <h3 className="text-2xl font-bold text-slate-900">
                  + Add Walk-In Patient
                </h3>
                <p className="text-base text-slate-500 mt-0.5">
                  Register a direct counter patient into today's queue
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-5 overflow-y-auto flex-1">
              <div>
                <label className="block text-base font-bold text-slate-800 mb-1.5">
                  Patient Full Name *
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Patient full name"
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-base font-bold text-slate-800 mb-1.5">
                    Age (Years)
                  </label>
                  <input
                    type="number"
                    value={form.age}
                    onChange={(e) => setForm({ ...form, age: e.target.value })}
                    placeholder="Age"
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-base font-bold text-slate-800 mb-1.5">
                    Time Slot
                  </label>
                  <input
                    type="text"
                    value={form.timeSlot}
                    onChange={(e) =>
                      setForm({ ...form, timeSlot: e.target.value })
                    }
                    placeholder="Time slot"
                    className="w-full px-4 py-3 border border-slate-300 rounded-xl text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-base font-bold text-slate-800 mb-1.5">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  placeholder="Mobile number"
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-base font-bold text-slate-800 mb-1.5">
                  Assign Doctor *
                </label>
                <select
                  value={form.doctor}
                  onChange={(e) => setForm({ ...form, doctor: e.target.value })}
                  className="w-full px-4 py-3 border border-slate-300 rounded-xl text-base font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="">Select an available doctor...</option>
                  {doctors
                    .filter((d) => d.available)
                    .map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name} — {d.specialty}
                      </option>
                    ))}
                </select>
              </div>
            </div>

            <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="px-6 py-3 rounded-xl text-base font-bold text-slate-700 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddWalkIn}
                disabled={
                  !form.name.trim() || !form.phone.trim() || !form.doctor
                }
                className="px-6 py-3 rounded-xl text-base font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-blue-200"
              >
                Add to Queue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
