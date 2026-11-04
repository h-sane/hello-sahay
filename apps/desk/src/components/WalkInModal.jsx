import { useState } from "react";
import { X } from "lucide-react";

const FIELD =
  "w-full px-4 py-3 border border-slate-300 rounded-xl text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500";

export default function WalkInModal({ doctors, onClose, onAdd }) {
  const empty = { name: "", phone: "", doctorId: doctors.length === 1 ? String(doctors[0].id) : "", reason: "" };
  const [form, setForm] = useState(empty);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async () => {
    setError("");
    setBusy(true);
    try {
      await onAdd({
        name: form.name.trim(),
        phone: form.phone.trim() || null,
        doctor_id: Number(form.doctorId),
        reason_text: form.reason.trim() || null,
      });
      onClose();
    } catch (e) {
      setError(e.status === 422 ? "Enter a valid 10-digit mobile number, or leave it empty." : e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-slate-50">
          <div>
            <h3 className="text-2xl font-bold text-slate-900">Add walk-in</h3>
            <p className="text-base text-slate-500 mt-0.5">Gets the next W number and waits for a free moment.</p>
          </div>
          <button onClick={onClose} aria-label="Close" className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto flex-1">
          {error && (
            <p role="alert" className="p-3 rounded-xl bg-red-50 border border-red-200 text-base font-medium text-red-700">
              {error}
            </p>
          )}
          <div>
            <label className="block text-base font-bold text-slate-800 mb-1.5" htmlFor="wi-name">Patient name *</label>
            <input id="wi-name" className={FIELD} value={form.name} onChange={set("name")} placeholder="Patient full name" />
          </div>
          <div>
            <label className="block text-base font-bold text-slate-800 mb-1.5" htmlFor="wi-doc">Doctor *</label>
            <select id="wi-doc" className={`${FIELD} bg-white`} value={form.doctorId} onChange={set("doctorId")}>
              <option value="">{doctors.length ? "Select a doctor..." : "No doctor is on duty"}</option>
              {doctors.map((d) => (
                <option key={d.id} value={d.id}>{d.name} — {d.specialty}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-base font-bold text-slate-800 mb-1.5" htmlFor="wi-phone">Mobile number</label>
            <input id="wi-phone" type="tel" className={FIELD} value={form.phone} onChange={set("phone")} placeholder="Optional" />
          </div>
          <div>
            <label className="block text-base font-bold text-slate-800 mb-1.5" htmlFor="wi-reason">Reason for visit</label>
            <input id="wi-reason" className={FIELD} value={form.reason} onChange={set("reason")} placeholder="Optional" />
          </div>
        </div>

        <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-6 py-3 rounded-xl text-base font-bold text-slate-700 hover:bg-slate-200 transition-colors">
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={busy || !form.name.trim() || !form.doctorId}
            className="px-6 py-3 rounded-xl text-base font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-blue-200"
          >
            {busy ? "Adding…" : "Add walk-in"}
          </button>
        </div>
      </div>
    </div>
  );
}
