import { useState } from "react";
import { Search } from "lucide-react";

const BADGE = {
  Completed: "bg-emerald-50 text-emerald-800 border-emerald-200",
  Arrived: "bg-amber-50 text-amber-800 border-amber-200",
  Booked: "bg-blue-50 text-blue-800 border-blue-200",
  Cancelled: "bg-slate-50 text-slate-600 border-slate-200",
  "No-show": "bg-rose-50 text-rose-800 border-rose-200",
};

// Visits before today, newest first. A doctor's list holds only their own patients (the API enforces it).
export default function HistoryTab({ visits, isDoctor }) {
  const [search, setSearch] = useState("");
  const q = search.trim().toLowerCase();
  const shown = visits.filter(
    (v) => !q || v.patientName.toLowerCase().includes(q) || v.phone.includes(q)
  );

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400" />
          <input
            type="text"
            placeholder="Search patient name or phone number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-4 py-3.5 border border-slate-300 rounded-xl text-lg font-medium text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <p className="text-base text-slate-500 mt-3">
          {isDoctor ? "Your patients from earlier days" : "Every visit from earlier days"}, newest first. Showing up to 300.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[640px]">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200">
                {["Date & Time", "Patient", ...(isDoctor ? [] : ["Doctor"]), "Reason", "Outcome"].map((h) => (
                  <th key={h} className="text-left py-4 px-5 text-sm font-black text-slate-700 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {shown.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-4 px-5 whitespace-nowrap">
                    <div className="text-lg font-bold text-slate-900">{v.date}</div>
                    <div className="text-base font-semibold text-slate-500">{v.timeSlot}</div>
                  </td>
                  <td className="py-4 px-5">
                    <div className="text-lg font-bold text-slate-900">{v.patientName}</div>
                    <div className="text-base font-semibold text-slate-500 font-mono">{v.phone}</div>
                  </td>
                  {!isDoctor && (
                    <td className="py-4 px-5">
                      <div className="text-lg font-bold text-slate-900">{v.doctor}</div>
                      <div className="text-base text-slate-600">{v.department}</div>
                    </td>
                  )}
                  <td className="py-4 px-5 text-base text-slate-700">{v.reason || "–"}</td>
                  <td className="py-4 px-5">
                    <span
                      className={`inline-flex px-3.5 py-1.5 rounded-full text-base font-bold border ${BADGE[v.status]}`}
                    >
                      {v.status === "Booked" ? "Not attended" : v.status === "Arrived" ? "Not closed" : v.status}
                    </span>
                  </td>
                </tr>
              ))}
              {shown.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 px-5 text-center text-lg font-medium text-slate-500">
                    {q ? `No visits match "${search}".` : "No earlier visits yet."}
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
