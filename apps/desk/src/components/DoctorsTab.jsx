import { Stethoscope, Clock, Users, UserCheck, AlertCircle } from "lucide-react";

export default function DoctorsTab({ doctors }) {

  const activeCount = doctors.filter((d) => d.available).length;
  const leaveCount = doctors.length - activeCount;

  return (
    <div className="space-y-6">
      {/* ── Header Row with Quick Summary ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-900">
            Doctors & Open Slots
          </h2>
          <p className="text-base text-slate-600 mt-1">
            Built from the selected day's bookings and its open slots. The helpline and the patient app book into these slots.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-base font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
            <span className="w-3 h-3 rounded-full bg-emerald-500" />
            {activeCount} With Open Slots
          </span>
          {leaveCount > 0 && (
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-base font-bold bg-rose-50 text-rose-800 border border-rose-200">
              <span className="w-3 h-3 rounded-full bg-rose-500" />
              {leaveCount} Fully Booked
            </span>
          )}
        </div>
      </div>

      {/* ── Doctor Cards Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {doctors.map((doc) => (
          <div
            key={doc.id}
            className={`bg-white rounded-2xl border-2 p-6 transition-all shadow-sm flex flex-col justify-between ${
              doc.available
                ? "border-slate-200 hover:border-blue-400"
                : "border-rose-200 bg-rose-50/20"
            }`}
          >
            <div>
              {/* Doctor Header & Toggle Switch */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex items-center gap-3.5">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-black shrink-0 ${
                      doc.available
                        ? "bg-blue-100 text-blue-800 ring-1 ring-blue-200"
                        : "bg-slate-200 text-slate-500"
                    }`}
                  >
                    {doc.name
                      .split(" ")
                      .slice(1)
                      .map((w) => w[0])
                      .join("")
                      .slice(0, 2) || "DR"}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 leading-snug">
                      {doc.name}
                    </h3>
                    <p className="text-base font-semibold text-blue-700 mt-0.5">
                      {doc.specialty}
                    </p>
                  </div>
                </div>
              </div>

              {/* Status Pill */}
              <div className="mb-5">
                {doc.available ? (
                  <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-base font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    Open Slots
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-base font-bold bg-rose-50 text-rose-800 border border-rose-200">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    Fully Booked
                  </span>
                )}
              </div>

              {/* Doctor Details (No Scheme lines!) */}
              <div className="space-y-3.5 text-base pt-2 border-t border-slate-100">
                <div className="flex items-center gap-3 text-slate-700">
                  <Clock className="w-5 h-5 text-slate-400 shrink-0" />
                  <span className="font-medium">{doc.timings}</span>
                </div>

                <div className="flex items-center gap-3 text-slate-700">
                  <Users className="w-5 h-5 text-slate-400 shrink-0" />
                  <span>
                    Booked:{" "}
                    <strong className="text-slate-900 font-extrabold text-lg">
                      {doc.bookedSlots}
                    </strong>{" "}
                    / {doc.totalSlots} slots
                  </span>
                </div>
              </div>
            </div>

            {/* Capacity Progress Bar */}
            <div className="mt-5 pt-4 border-t border-slate-100">
              <div className="flex justify-between text-sm font-bold text-slate-500 mb-1.5">
                <span>Capacity</span>
                <span>
                  {Math.round((doc.bookedSlots / Math.max(doc.totalSlots, 1)) * 100)}% Filled
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    doc.bookedSlots / Math.max(doc.totalSlots, 1) >= 0.85
                      ? "bg-rose-500"
                      : doc.bookedSlots / Math.max(doc.totalSlots, 1) >= 0.6
                      ? "bg-amber-500"
                      : "bg-emerald-500"
                  }`}
                  style={{
                    width: `${Math.min(
                      100,
                      (doc.bookedSlots / Math.max(doc.totalSlots, 1)) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
