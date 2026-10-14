import { useEffect, useState } from "react";
import { KeyRound, Plus, Power, X, Copy, Check } from "lucide-react";
import { api } from "../api";
import { ROLE_LABEL } from "../mappers";

const ROLE_CHOICES = ["receptionist", "nurse", "doctor"];
const LANGS = [["ta", "Tamil"], ["hi", "Hindi"], ["en", "English"]];
const ROLE_BADGE = {
  hospital_admin: "bg-purple-100 text-purple-900 border-purple-200",
  receptionist: "bg-blue-100 text-blue-900 border-blue-200",
  nurse: "bg-teal-100 text-teal-900 border-teal-200",
  doctor: "bg-emerald-100 text-emerald-900 border-emerald-200",
};
const DEFAULT_DEPARTMENTS = ["General Medicine", "Obstetrics", "Paediatrics", "Orthopaedics", "Dental", "Ophthalmology"];

// No look-alike characters (0/O, 1/l/I) so a password read out over the phone survives.
function makePassword() {
  const alphabet = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
}

const input =
  "w-full px-4 py-3 border border-slate-300 rounded-xl text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";
const label = "block text-base font-bold text-slate-800 mb-1.5";

function Modal({ title, subtitle, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg border border-slate-200 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 bg-slate-50">
          <div>
            <h3 className="text-2xl font-bold text-slate-900">{title}</h3>
            {subtitle && <p className="text-base text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

// Shown once after a login is created or a password reset: the password cannot be read again.
function Credentials({ email, password, onClose }) {
  const [copied, setCopied] = useState(false);
  const text = `Sahay Desk login\nEmail: ${email}\nPassword: ${password}`;
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
    } catch {
      /* clipboard blocked: the details are on screen */
    }
  };
  return (
    <Modal title="Login ready" subtitle="Share these details with the person now" onClose={onClose}>
      <div className="p-6 space-y-4">
        <div className="rounded-2xl bg-slate-50 border border-slate-200 p-5 font-mono text-lg space-y-2 break-all">
          <div><span className="text-slate-500">Email: </span><strong>{email}</strong></div>
          <div><span className="text-slate-500">Password: </span><strong>{password}</strong></div>
        </div>
        <p className="text-base text-amber-800 bg-amber-50 border border-amber-200 rounded-xl p-3 font-medium">
          The password is not stored in readable form, so it cannot be shown again. You can reset it any time.
        </p>
      </div>
      <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
        <button onClick={copy} className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-base font-bold text-slate-700 hover:bg-slate-200">
          {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
          {copied ? "Copied" : "Copy details"}
        </button>
        <button onClick={onClose} className="px-6 py-3 rounded-xl text-base font-bold text-white bg-blue-600 hover:bg-blue-700">
          Done
        </button>
      </div>
    </Modal>
  );
}

function AddUser({ doctors, departments, onClose, onCreated }) {
  const unlinked = doctors.filter((d) => !d.hasLogin);
  const blank = { role: "receptionist", name: "", email: "", password: makePassword(), doctorId: "", department: "", languages: ["ta", "en"] };
  const [form, setForm] = useState(blank);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const choices = departments.length ? departments : DEFAULT_DEPARTMENTS;
  const isDoctor = form.role === "doctor";
  const linking = isDoctor && form.doctorId;
  const ready =
    form.email.trim() && form.password.length >= 8 &&
    (linking || form.name.trim()) &&
    (!isDoctor || linking || form.department);

  const submit = async () => {
    setErr("");
    setBusy(true);
    try {
      const picked = unlinked.find((d) => String(d.id) === form.doctorId);
      const body = {
        email: form.email.trim(),
        password: form.password,
        name: picked ? picked.name : form.name.trim(),
        role: form.role,
      };
      if (isDoctor && picked) body.doctor_id = picked.id;
      else if (isDoctor) body.doctor = { department: form.department, languages: form.languages };
      await api.createUser(body);
      onCreated({ email: body.email, password: form.password });
    } catch (e) {
      setErr(e.status === 409 ? "That email already has a login." : e.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Add a login" subtitle="Create sign-in details for a member of staff" onClose={onClose}>
      <div className="p-6 space-y-5 overflow-y-auto flex-1">
        {err && (
          <p role="alert" className="p-3 rounded-xl bg-red-50 border border-red-200 text-base font-medium text-red-700">{err}</p>
        )}
        <div>
          <label className={label}>Role *</label>
          <div className="grid grid-cols-3 gap-2">
            {ROLE_CHOICES.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => set({ role: r, doctorId: "" })}
                aria-pressed={form.role === r}
                className={`px-3 py-3 rounded-xl text-base font-bold border-2 transition-colors ${
                  form.role === r ? "border-blue-600 bg-blue-50 text-blue-800" : "border-slate-200 text-slate-700 hover:bg-slate-50"
                }`}
              >
                {ROLE_LABEL[r]}
              </button>
            ))}
          </div>
          <p className="text-sm text-slate-500 mt-1.5">
            {isDoctor
              ? "A doctor sees only their own appointments and past patients. No Users tab."
              : "Sees every appointment, doctor and call log. No Users tab."}
          </p>
        </div>

        {isDoctor && unlinked.length > 0 && (
          <div>
            <label className={label}>Doctor</label>
            <select value={form.doctorId} onChange={(e) => set({ doctorId: e.target.value })} className={input}>
              <option value="">New doctor (fill in below)</option>
              {unlinked.map((d) => (
                <option key={d.id} value={d.id}>{d.name} — {d.specialty} (no login yet)</option>
              ))}
            </select>
          </div>
        )}

        {!linking && (
          <div>
            <label className={label}>Full name *</label>
            <input className={input} value={form.name} onChange={(e) => set({ name: e.target.value })}
              placeholder={isDoctor ? "e.g. Dr. Meena Iyer" : "Full name"} />
          </div>
        )}

        {isDoctor && !linking && (
          <>
            <div>
              <label className={label}>Department *</label>
              <select value={form.department} onChange={(e) => set({ department: e.target.value })} className={input}>
                <option value="">Select a department...</option>
                {choices.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className={label}>Languages spoken</label>
              <div className="flex flex-wrap gap-3">
                {LANGS.map(([code, name]) => (
                  <label key={code} className="inline-flex items-center gap-2 text-base font-medium text-slate-800">
                    <input
                      type="checkbox"
                      className="w-5 h-5"
                      checked={form.languages.includes(code)}
                      onChange={(e) =>
                        set({ languages: e.target.checked ? [...form.languages, code] : form.languages.filter((l) => l !== code) })
                      }
                    />
                    {name}
                  </label>
                ))}
              </div>
            </div>
          </>
        )}

        <div>
          <label className={label}>Email (their sign-in) *</label>
          <input className={input} type="email" value={form.email} onChange={(e) => set({ email: e.target.value })}
            placeholder="name@yourhospital.com" autoComplete="off" />
        </div>
        <div>
          <label className={label}>Password * <span className="font-medium text-slate-500">(at least 8 characters)</span></label>
          <div className="flex gap-2">
            <input className={`${input} font-mono`} value={form.password} onChange={(e) => set({ password: e.target.value })} autoComplete="off" />
            <button type="button" onClick={() => set({ password: makePassword() })}
              className="px-4 rounded-xl text-base font-bold text-slate-700 border border-slate-300 hover:bg-slate-100 shrink-0">
              Generate
            </button>
          </div>
        </div>
      </div>
      <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
        <button type="button" onClick={onClose} className="px-6 py-3 rounded-xl text-base font-bold text-slate-700 hover:bg-slate-200">
          Cancel
        </button>
        <button type="button" onClick={submit} disabled={busy || !ready}
          className="px-6 py-3 rounded-xl text-base font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-blue-200">
          {busy ? "Creating…" : "Create login"}
        </button>
      </div>
    </Modal>
  );
}

function ResetPassword({ user, onClose, onDone }) {
  const [password, setPassword] = useState(makePassword());
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const submit = async () => {
    setBusy(true);
    setErr("");
    try {
      await api.updateUser(user.id, { password });
      onDone({ email: user.email, password });
    } catch (e) {
      setErr(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal title="Reset password" subtitle={`${user.name} · ${user.email}`} onClose={onClose}>
      <div className="p-6 space-y-4">
        {err && <p role="alert" className="p-3 rounded-xl bg-red-50 border border-red-200 text-base font-medium text-red-700">{err}</p>}
        <label className={label}>New password <span className="font-medium text-slate-500">(at least 8 characters)</span></label>
        <div className="flex gap-2">
          <input className={`${input} font-mono`} value={password} onChange={(e) => setPassword(e.target.value)} />
          <button type="button" onClick={() => setPassword(makePassword())}
            className="px-4 rounded-xl text-base font-bold text-slate-700 border border-slate-300 hover:bg-slate-100 shrink-0">
            Generate
          </button>
        </div>
      </div>
      <div className="p-6 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
        <button onClick={onClose} className="px-6 py-3 rounded-xl text-base font-bold text-slate-700 hover:bg-slate-200">Cancel</button>
        <button onClick={submit} disabled={busy || password.length < 8}
          className="px-6 py-3 rounded-xl text-base font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-40">
          {busy ? "Saving…" : "Set password"}
        </button>
      </div>
    </Modal>
  );
}

export default function UsersTab({ self, doctors, departments, onError, onChanged }) {
  const [users, setUsers] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [dialog, setDialog] = useState(null); // {kind: "add"} | {kind: "reset", user} | {kind: "creds", ...}

  const load = () =>
    api.users().then(setUsers).catch(onError).finally(() => setLoaded(true));
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = async (u) => {
    try {
      await api.updateUser(u.id, { active: !u.active });
    } catch (e) {
      onError(e);
    }
    load();
  };

  const created = (creds) => {
    setDialog({ kind: "creds", ...creds });
    load();
    onChanged();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-900">Staff Logins</h2>
          <p className="text-base text-slate-600 mt-1">
            Create a login for each receptionist, nurse and doctor. Receptionists and nurses see everything except this tab; a doctor sees only their own patients.
          </p>
        </div>
        <button
          onClick={() => setDialog({ kind: "add" })}
          className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-lg font-bold rounded-xl shadow-sm transition-colors shrink-0"
        >
          <Plus className="w-6 h-6" />
          Add Login
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[720px]">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200">
                {["Name", "Role", "Email", "Status", "Actions"].map((h) => (
                  <th key={h} className="text-left py-4 px-5 text-sm font-black text-slate-700 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {users.map((u) => {
                const mine = u.email === self;
                const locked = u.role === "hospital_admin"; // only the Hello Sahay team changes an admin
                return (
                  <tr key={u.id} className={`hover:bg-slate-50 ${u.active ? "" : "opacity-60"}`}>
                    <td className="py-4 px-5">
                      <div className="text-lg font-bold text-slate-900">{u.name || "–"}{mine && <span className="ml-2 text-sm font-semibold text-slate-500">(you)</span>}</div>
                      {u.department && <div className="text-base text-slate-600">{u.department}</div>}
                    </td>
                    <td className="py-4 px-5">
                      <span className={`inline-flex px-3.5 py-1.5 rounded-full text-base font-bold border ${ROLE_BADGE[u.role]}`}>
                        {ROLE_LABEL[u.role] || u.role}
                      </span>
                    </td>
                    <td className="py-4 px-5 font-mono text-base text-slate-700 break-all">{u.email}</td>
                    <td className="py-4 px-5 text-base font-bold">
                      {u.active ? <span className="text-emerald-700">Active</span> : <span className="text-rose-700">Switched off</span>}
                    </td>
                    <td className="py-4 px-5">
                      {locked ? (
                        <span className="text-base text-slate-400">Managed by Hello Sahay</span>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          <button onClick={() => setDialog({ kind: "reset", user: u })}
                            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-base font-bold text-slate-700 border border-slate-300 hover:bg-slate-100">
                            <KeyRound className="w-4 h-4" /> Reset password
                          </button>
                          {!mine && (
                            <button onClick={() => toggle(u)}
                              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-base font-bold text-slate-700 border border-slate-300 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200">
                              <Power className="w-4 h-4" /> {u.active ? "Switch off" : "Switch on"}
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {loaded && users.length === 0 && (
                <tr><td colSpan={5} className="py-12 text-center text-lg font-medium text-slate-500">No logins yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {dialog?.kind === "add" && (
        <AddUser doctors={doctors} departments={departments} onClose={() => setDialog(null)} onCreated={created} />
      )}
      {dialog?.kind === "reset" && (
        <ResetPassword user={dialog.user} onClose={() => setDialog(null)}
          onDone={(creds) => setDialog({ kind: "creds", ...creds })} />
      )}
      {dialog?.kind === "creds" && (
        <Credentials email={dialog.email} password={dialog.password} onClose={() => setDialog(null)} />
      )}
    </div>
  );
}
