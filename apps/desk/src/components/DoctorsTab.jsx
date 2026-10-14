import { Clock, Users, Power } from "lucide-react";

// A doctor is "available" when on duty with open slots; off duty takes no new bookings from the helpline or app.
function state(doc) {
  if (!doc.onDuty) return "off";
  return doc.openSlots > 0 ? "open" : "full";
}

const PILL = {
  open: ["Open Slots", "bg-emerald-50 text-emerald-800 border-emerald-200", "bg-emerald-500"],
  full: ["Fully Booked", "bg-amber-50 text-amber-900 border-amber-300", "bg-amber-500"],
  off: ["Off Duty", "bg-rose-50 text-rose-800 border-rose-200", "bg-rose-500"],
};

export default function DoctorsTab({ doctors, onToggleDuty }) {
  const count = (k) => doctors.filter((d) => state(d) === k).length;

  return (
    <div className="space-y-6">
      {/* ── Header Row with Quick Summary ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Doctors & Open Slots</h2>
          <p className="text-base text-slate-600 mt-1">
            Every doctor at this hospital for the selected day. Switch a doctor off duty and the helpline and patient app stop booking them.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {["open", "full", "off"].map(
            (k) =>
              (k === "open" || count(k) > 0) && (
                <span
                  key={k}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-base font-bold border ${PILL[k][1]}`}
                >
                  <span className={`w-3 h-3 rounded-full ${PILL[k][2]}`} />
                  {count(k)} {PILL[k][0]}
                </span>
              )
          )}
        </div>
      </div>

      {doctors.length === 0 && (
        <p className="py-12 text-center text-lg font-medium text-slate-500">
          No doctors are set up for this hospital yet. Add doctor logins in the Users tab.
        </p>
      )}

      {/* ── Doctor Cards Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {doctors.map((doc) => {
          const st = state(doc);
          const filled = doc.bookedSlots / Math.max(doc.totalSlots, 1);
          return (
            <div
              key={doc.id}
              className={`bg-white rounded-2xl border-2 p-6 transition-all shadow-sm flex flex-col justify-between ${
                st === "off" ? "border-rose-200 bg-rose-50/20" : "border-slate-200 hover:border-blue-400"
              }`}
            >
              <div>
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-black shrink-0 ${
                        st === "off"
                          ? "bg-slate-200 text-slate-500"
                          : "bg-blue-100 text-blue-800 ring-1 ring-blue-200"
                      }`}
                    >
                      {doc.name
                        .split(" ")
                        .slice(1)
                        .map((w) => w[0])
                        .join("")
                        .slice(0, 2) || "DR"}
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-xl font-bold text-slate-900 leading-snug">{doc.name}</h3>
                      <p className="text-base font-semibold text-blue-700 mt-0.5">{doc.specialty}</p>
                    </div>
                  </div>
                </div>

                <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                  <span
                    className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-base font-bold border ${PILL[st][1]}`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full ${PILL[st][2]}`} />
                    {PILL[st][0]}
                  </span>
                  <button
                    onClick={() => onToggleDuty(doc.id, !doc.onDuty)}
                    className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-base font-bold border transition-colors ${
                      doc.onDuty
                        ? "text-slate-700 border-slate-300 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200"
                        : "text-white bg-emerald-600 border-emerald-600 hover:bg-emerald-700"
                    }`}
                  >
                    <Power className="w-4 h-4" />
                    {doc.onDuty ? "Set off duty" : "Set on duty"}
                  </button>
                </div>

                <div className="space-y-3.5 text-base pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-3 text-slate-700">
                    <Clock className="w-5 h-5 text-slate-400 shrink-0" />
                    <span className="font-medium">{doc.timings}</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-700">
                    <Users className="w-5 h-5 text-slate-400 shrink-0" />
                    <span>
                      Booked:{" "}
                      <strong className="text-slate-900 font-extrabold text-lg">{doc.bookedSlots}</strong>{" "}
                      / {doc.totalSlots} slots
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100">
                <div className="flex justify-between text-sm font-bold text-slate-500 mb-1.5">
                  <span>Capacity</span>
                  <span>{Math.round(filled * 100)}% Filled</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      filled >= 0.85 ? "bg-rose-500" : filled >= 0.6 ? "bg-amber-500" : "bg-emerald-500"
                    }`}
                    style={{ width: `${Math.min(100, filled * 100)}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
