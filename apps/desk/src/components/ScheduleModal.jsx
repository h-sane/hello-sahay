import { useEffect, useState } from "react";
import { X, Plus } from "lucide-react";
import { api } from "../api";
import { WEEKDAYS, hhmm } from "../mappers";

const SLOT_CHOICES = [10, 15, 20, 30, 45, 60];
const RUN_CHOICES = [1, 2, 3, 4, 5, 6];
const BREAK_CHOICES = [10, 15, 20, 30, 45, 60];

function Choice({ options, value, onChange, suffix = "" }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onChange(o)}
          aria-pressed={value === o}
          className={`min-w-[3.5rem] px-3.5 py-2.5 rounded-xl text-base font-bold border-2 transition-colors ${
            value === o ? "bg-blue-600 border-blue-600 text-white" : "bg-white border-slate-200 text-slate-700 hover:border-blue-400"
          }`}
        >
          {o}
          {suffix}
        </button>
      ))}
    </div>
  );
}

function Label({ children, hint }) {
  return (
    <div className="mb-2">
      <p className="text-base font-bold text-slate-800">{children}</p>
      {hint && <p className="text-sm text-slate-500">{hint}</p>}
    </div>
  );
}

const MODES = [
  ["appointments", "Appointments only", "Every slot can be booked. No time is kept aside for walk-ins."],
  ["partial", "Appointments and walk-ins", "After a few slots there is a break with no slot, so the helpline and the app never book it. Walk-ins go in then."],
];

export default function ScheduleModal({ doctor, doctorCount, onClose, onSave }) {
  const [plan, setPlan] = useState({
    mode: doctor.schedule.mode,
    slot_minutes: doctor.schedule.slot_minutes,
    run: doctor.schedule.mode === "partial" ? doctor.schedule.run : 3,
    break_minutes: doctor.schedule.mode === "partial" ? doctor.schedule.break_minutes : 20,
    windows: doctor.schedule.windows,
    days_off: doctor.schedule.days_off,
  });
  const [all, setAll] = useState(false);
  const [preview, setPreview] = useState(null);
  const [problem, setProblem] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const set = (patch) => setPlan({ ...plan, ...patch });
  const partial = plan.mode === "partial";

  useEffect(() => {
    let current = true;
    api
      .previewSchedule(plan)
      .then((p) => current && (setPreview(p), setProblem("")))
      .catch((e) => current && (setPreview(null), setProblem(e.message)));
    return () => {
      current = false;
    };
  }, [plan]);

  const setWindow = (i, k, v) =>
    set({ windows: plan.windows.map((w, j) => (j === i ? (k === "start" ? [v, w[1]] : [w[0], v]) : w)) });
  const toggleDay = (d) =>
    set({ days_off: plan.days_off.includes(d) ? plan.days_off.filter((x) => x !== d) : [...plan.days_off, d] });

  const save = async () => {
    setBusy(true);
    setProblem("");
    try {
      setResult(await onSave(doctor.id, { ...plan, apply_to_all: all }));
    } catch (e) {
      setProblem(e.message);
    } finally {
      setBusy(false);
    }
  };

  if (result) {
    const kept = result.saved.reduce((n, d) => n + d.kept_outside, 0);
    return (
      <Shell title="Timetable saved" onClose={onClose}>
        <div className="p-6 space-y-3 text-base text-slate-700">
          <p className="font-bold text-emerald-700 text-lg">
            {result.saved.length > 1 ? `${result.saved.length} doctors updated.` : `${doctor.name} updated.`}
          </p>
          <p>The helpline and the patient app now offer the new slots for the coming week.</p>
          {kept > 0 && (
            <p className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
              {kept} existing booking{kept > 1 ? "s are" : " is"} outside the new times. They stay as booked: contact the patient{kept > 1 ? "s" : ""} to move them if needed.
            </p>
          )}
        </div>
        <Footer>
          <button onClick={onClose} className="px-6 py-3 rounded-xl text-base font-bold text-white bg-blue-600 hover:bg-blue-700">Done</button>
        </Footer>
      </Shell>
    );
  }

  return (
    <Shell title={`Timetable for ${doctor.name}`} onClose={onClose}>
      <div className="p-6 space-y-7 overflow-y-auto flex-1">
        {problem && (
          <p role="alert" className="p-3 rounded-xl bg-red-50 border border-red-200 text-base font-medium text-red-700">{problem}</p>
        )}

        <div>
          <Label>How does this doctor take patients?</Label>
          <div className="grid sm:grid-cols-2 gap-3">
            {MODES.map(([value, title, text]) => (
              <button
                key={value}
                type="button"
                onClick={() => set({ mode: value })}
                aria-pressed={plan.mode === value}
                className={`text-left p-4 rounded-2xl border-2 transition-colors ${
                  plan.mode === value ? "border-blue-600 bg-blue-50" : "border-slate-200 hover:border-blue-300"
                }`}
              >
                <p className="text-lg font-black text-slate-900">{title}</p>
                <p className="text-sm text-slate-600 mt-1">{text}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label>Length of one appointment</Label>
          <Choice options={SLOT_CHOICES} value={plan.slot_minutes} onChange={(v) => set({ slot_minutes: v })} suffix=" min" />
        </div>

        {partial && (
          <>
            <div>
              <Label hint="Then the break starts.">Appointments in a row</Label>
              <Choice options={RUN_CHOICES} value={plan.run} onChange={(v) => set({ run: v })} />
            </div>
            <div>
              <Label hint="Kept free for walk-ins. If a visit ends early, that time goes to walk-ins too.">Break for walk-ins</Label>
              <Choice options={BREAK_CHOICES} value={plan.break_minutes} onChange={(v) => set({ break_minutes: v })} suffix=" min" />
            </div>
          </>
        )}

        <div>
          <Label>Working hours</Label>
          <div className="space-y-2.5">
            {plan.windows.map((w, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2.5">
                <input type="time" aria-label="From" value={w[0]} onChange={(e) => setWindow(i, "start", e.target.value)}
                  className="px-3 py-2.5 border border-slate-300 rounded-xl text-base font-semibold" />
                <span className="text-slate-500 font-semibold">to</span>
                <input type="time" aria-label="To" value={w[1]} onChange={(e) => setWindow(i, "end", e.target.value)}
                  className="px-3 py-2.5 border border-slate-300 rounded-xl text-base font-semibold" />
                {plan.windows.length > 1 && (
                  <button type="button" onClick={() => set({ windows: plan.windows.filter((_, j) => j !== i) })}
                    aria-label="Remove these hours" className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50">
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            ))}
            {plan.windows.length < 3 && (
              <button type="button" onClick={() => set({ windows: [...plan.windows, ["14:00", "16:00"]] })}
                className="inline-flex items-center gap-1.5 text-base font-bold text-blue-700 hover:text-blue-900">
                <Plus className="w-5 h-5" /> Add another period
              </button>
            )}
          </div>
        </div>

        <div>
          <Label hint="Tap the days this doctor does not see patients.">Weekly days off</Label>
          <div className="flex flex-wrap gap-2">
            {WEEKDAYS.map((name, d) => (
              <button key={name} type="button" onClick={() => toggleDay(d)} aria-pressed={plan.days_off.includes(d)}
                className={`px-3.5 py-2.5 rounded-xl text-base font-bold border-2 transition-colors ${
                  plan.days_off.includes(d) ? "bg-rose-50 border-rose-300 text-rose-800" : "bg-white border-slate-200 text-slate-700 hover:border-blue-400"
                }`}>
                {name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <Label>A working day</Label>
          {preview ? (
            <>
              <div className="flex flex-wrap gap-1.5">
                {preview.pieces.map((p, i) =>
                  p.kind === "appointment" ? (
                    <span key={i} className="px-2.5 py-1 rounded-lg bg-blue-100 text-blue-900 text-sm font-bold">{hhmm(p.start)}</span>
                  ) : (
                    <span key={i} className="px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 text-sm font-bold border border-amber-300">
                      walk-ins {hhmm(p.start)}–{hhmm(p.end)}
                    </span>
                  )
                )}
              </div>
              <p className="text-sm text-slate-600 mt-2.5">
                {preview.appointment_slots} bookable slots
                {preview.walk_in_minutes > 0 && `, ${Math.floor(preview.walk_in_minutes / 60) ? `${Math.floor(preview.walk_in_minutes / 60)} h ` : ""}${preview.walk_in_minutes % 60 ? `${preview.walk_in_minutes % 60} min ` : ""}kept for walk-ins`}.
              </p>
            </>
          ) : (
            <p className="text-sm text-slate-500">Fix the highlighted problem to see the day.</p>
          )}
        </div>

        {doctorCount > 1 && (
          <label className="flex items-start gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer">
            <input type="checkbox" checked={all} onChange={(e) => setAll(e.target.checked)} className="w-5 h-5 mt-0.5 accent-blue-600" />
            <span className="text-base font-semibold text-slate-800">
              Use this timetable for all {doctorCount} doctors at this hospital
            </span>
          </label>
        )}
      </div>

      <Footer>
        <button type="button" onClick={onClose} className="px-6 py-3 rounded-xl text-base font-bold text-slate-700 hover:bg-slate-200 transition-colors">Cancel</button>
        <button type="button" onClick={save} disabled={busy || !preview}
          className="px-6 py-3 rounded-xl text-base font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-blue-200">
          {busy ? "Saving…" : "Save timetable"}
        </button>
      </Footer>
    </Shell>
  );
}

function Shell({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-slate-50">
          <h3 className="text-2xl font-bold text-slate-900">{title}</h3>
          <button onClick={onClose} aria-label="Close" className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200">
            <X className="w-6 h-6" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Footer({ children }) {
  return <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">{children}</div>;
}
