import { useCallback, useEffect, useRef, useState } from "react";
import Navbar from "./components/Navbar";
import AppointmentsTab from "./components/AppointmentsTab";
import DoctorsTab from "./components/DoctorsTab";
import CallLogsTab from "./components/CallLogsTab";
import LoginPage from "./components/LoginPage";
import { api, liveSocketUrl, session as sessionStore } from "./api";
import { MapPin, Menu, AlertCircle, X, ChevronLeft, ChevronRight } from "lucide-react";

const TYPE_LABEL = {
  PHC: "Primary Health Centre",
  CHC: "Community Health Centre",
  GH: "Government Hospital",
  private: "Private facility",
};

const isoDay = (d) => d.toLocaleDateString("en-CA");
const shiftDay = (iso, by) => {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + by);
  return isoDay(d);
};

const clock = (iso) =>
  new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });

const loadSet = (key) => {
  try {
    return new Set(JSON.parse(localStorage.getItem(key)) || []);
  } catch {
    return new Set();
  }
};
const saveSet = (key, set) => {
  try {
    localStorage.setItem(key, JSON.stringify([...set]));
  } catch {
    /* private mode: the flag then lasts only until reload */
  }
};

// Maps the API appointment to the shape the tabs render. "Completed" and
// "callback done" have no backend state yet, so they are kept per facility in
// this browser only.
function toRow(a, token, done) {
  const status =
    a.status === "cancelled" ? "Cancelled"
    : a.status === "no_show" ? "No-show"
    : a.status === "arrived" ? (done.has(a.id) ? "Completed" : "Arrived")
    : "Booked";
  return {
    id: a.id,
    token,
    patientName: a.patient.name || "Unnamed patient",
    phone: a.patient.phone,
    doctor: a.doctor.name,
    department: a.doctor.department,
    timeSlot: clock(a.slot.start),
    status,
    source: a.source,
    reason: a.reason_text,
  };
}

const OUTCOME = {
  booked: "Slot Booked",
  emergency: "108 Emergency Redirected",
  handed_off: "Needs Callback",
  info_given: "Information Given",
};
const LANG = { ta: "Tamil", hi: "Hindi", en: "English" };

function toCallRow(c, called) {
  let outcome = OUTCOME[c.outcome] || "Information Given";
  if (c.emergency) outcome = OUTCOME.emergency;
  else if (c.handoff) outcome = called.has(c.id) ? "Callback Completed" : OUTCOME.handed_off;
  return {
    id: c.id,
    callerPhone: c.patient_phone || "Unknown caller",
    time: new Date(c.started_at).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
    }),
    language: LANG[c.language] || "English",
    summary: c.summary || "No summary recorded for this call.",
    outcome,
  };
}

// Doctor roster derived from today's appointments and the slots still open.
function buildRoster(appointments, openSlots) {
  const byDoctor = new Map();
  const entry = (id, name, department) => {
    if (!byDoctor.has(id))
      byDoctor.set(id, {
        id,
        name,
        specialty: department,
        bookedSlots: 0,
        openSlots: 0,
        first: null,
        last: null,
      });
    return byDoctor.get(id);
  };
  const span = (d, start, end) => {
    if (!d.first || start < d.first) d.first = start;
    if (!d.last || end > d.last) d.last = end;
  };
  for (const a of appointments) {
    if (a.status === "cancelled") continue;
    const d = entry(a.doctor.id, a.doctor.name, a.doctor.department);
    d.bookedSlots += 1;
    span(d, a.slot.start, a.slot.end);
  }
  for (const s of openSlots) {
    const d = entry(s.doctor_id, s.doctor_name, s.department);
    d.openSlots += 1;
    span(d, s.start, s.end);
  }
  return [...byDoctor.values()]
    .map((d) => ({
      ...d,
      totalSlots: d.bookedSlots + d.openSlots,
      timings: d.first ? `${clock(d.first)} – ${clock(d.last)}` : "No slots today",
      available: d.openSlots > 0,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export default function App() {
  const [auth, setAuth] = useState(sessionStore.get());
  const [hospital, setHospital] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("appointments");
  const [day, setDay] = useState(isoDay(new Date()));
  const [raw, setRaw] = useState({ appointments: [], slots: [], calls: [] });
  const [loading, setLoading] = useState(false);
  const [live, setLive] = useState(false);
  const [error, setError] = useState("");
  const [doneIds, setDoneIds] = useState(new Set());
  const [calledIds, setCalledIds] = useState(new Set());

  const facilityId = auth?.facility_id;
  const doneKey = `sahay.done.${facilityId}`;
  const calledKey = `sahay.called.${facilityId}`;

  const logout = useCallback(() => {
    sessionStore.clear();
    setAuth(null);
    setHospital(null);
    setLive(false);
    setMobileMenuOpen(false);
  }, []);

  const fail = useCallback(
    (e) => {
      if (e.status === 401) return logout();
      setError(e.message || "Something went wrong. Please try again.");
    },
    [logout]
  );

  const refresh = useCallback(async () => {
    if (!facilityId) return;
    try {
      const [appointments, slots, calls] = await Promise.all([
        api.appointments(day),
        api.slots(facilityId, day),
        api.calls(),
      ]);
      setRaw({ appointments, slots, calls });
    } catch (e) {
      fail(e);
    }
  }, [facilityId, day, fail]);

  const handleLogin = async (email, password) => {
    const res = await api.login(email, password);
    if (res.role !== "desk") {
      throw new Error(
        "This account is not tied to one facility. Sign in with a facility account."
      );
    }
    const next = { token: res.token, role: res.role, facility_id: res.facility_id, email };
    sessionStore.set(next);
    setAuth(next);
  };

  // On sign-in (or a reload with a stored session): identity, local flags, first load.
  useEffect(() => {
    if (!facilityId) return;
    setDoneIds(loadSet(doneKey));
    setCalledIds(loadSet(calledKey));
    api
      .facilities()
      .then((list) => {
        const f = list.find((x) => x.id === facilityId);
        setHospital({
          name: f?.name || `Facility ${facilityId}`,
          email: auth.email || "",
          planBadge: TYPE_LABEL[f?.type] || "Partner facility",
        });
      })
      .catch(fail);
  }, [facilityId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Refetch on first load and whenever the viewed day changes.
  useEffect(() => {
    if (!facilityId) return;
    setLoading(true);
    refresh().finally(() => setLoading(false));
  }, [refresh]); // eslint-disable-line react-hooks/exhaustive-deps

  // Live updates: any pushed booking or call triggers a refetch.
  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;
  useEffect(() => {
    if (!facilityId) return;
    let ws;
    let retry;
    let closed = false;
    const connect = () => {
      ws = new WebSocket(liveSocketUrl(facilityId, auth.token));
      ws.onopen = () => setLive(true);
      ws.onmessage = () => refreshRef.current();
      ws.onclose = () => {
        setLive(false);
        if (!closed) retry = setTimeout(connect, 3000);
      };
    };
    connect();
    return () => {
      closed = true;
      clearTimeout(retry);
      ws?.close();
    };
  }, [facilityId, auth?.token]);

  const markArrived = async (id) => {
    setError("");
    try {
      await api.act(id, "arrived");
    } catch (e) {
      fail(e);
    }
    await refresh();
  };

  const markDone = (id) => {
    const next = new Set(doneIds).add(id);
    setDoneIds(next);
    saveSet(doneKey, next);
  };

  const markCalledBack = (id) => {
    const next = new Set(calledIds).add(id);
    setCalledIds(next);
    saveSet(calledKey, next);
  };

  // A walk-in is a desk booking that is marked arrived straight away.
  const addWalkIn = async ({ name, phone, slotId, reason }) => {
    const booked = await api.book({
      patient: { name, phone },
      slot_id: slotId,
      source: "desk",
      reason_text: reason || null,
    });
    await api.act(booked.id, "arrived");
    await refresh();
  };

  if (!auth) return <LoginPage onLogin={handleLogin} />;
  if (!hospital) {
    return (
      <div className="min-h-screen flex items-center justify-center text-lg font-semibold text-slate-500">
        Loading your facility…
      </div>
    );
  }

  const ranked = raw.appointments
    .filter((a) => a.status !== "cancelled")
    .sort((a, b) => a.slot.start.localeCompare(b.slot.start) || a.id - b.id);
  const tokenOf = new Map(ranked.map((a, i) => [a.id, i + 1]));
  const appointments = raw.appointments.map((a) =>
    toRow(a, tokenOf.get(a.id) ?? "–", doneIds)
  );
  const callLogs = raw.calls.map((c) => toCallRow(c, calledIds));
  const doctorsList = buildRoster(raw.appointments, raw.slots);
  const currentHospital = hospital;

  const tabTitles = {
    appointments: "Appointments & Live Queue",
    doctors: "Doctors & Open Slots",
    callLogs: "Voice AI Helpline Call Logs",
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentHospital={currentHospital}
        onLogout={logout}
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      <main className="flex-1 ml-0 lg:ml-80 min-w-0 transition-all">
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-3.5 sm:py-5 shadow-xs">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors shrink-0"
                aria-label="Open navigation menu"
              >
                <Menu className="w-6 h-6" />
              </button>

              <div className="min-w-0">
                <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-slate-500 mb-0.5 truncate">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{currentHospital.name}</span>
                  <span className="hidden sm:inline">·</span>
                  <span className="hidden sm:inline font-bold text-blue-700">
                    {currentHospital.planBadge}
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight truncate">
                  {tabTitles[activeTab]}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-4 text-sm sm:text-base font-semibold text-slate-600 bg-slate-50 px-3 sm:px-4 py-2 rounded-xl border border-slate-200 shrink-0">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setDay(shiftDay(day, -1))}
                  aria-label="Previous day"
                  className="p-1 rounded-lg hover:bg-slate-200"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="whitespace-nowrap min-w-[7.5rem] text-center">
                  {new Date(`${day}T12:00:00`).toLocaleDateString("en-IN", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })}
                </span>
                <button
                  onClick={() => setDay(shiftDay(day, 1))}
                  aria-label="Next day"
                  className="p-1 rounded-lg hover:bg-slate-200"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
              <span className="hidden sm:inline text-slate-300">|</span>
              <div
                className={`flex items-center gap-1.5 font-bold whitespace-nowrap ${
                  live ? "text-emerald-700" : "text-amber-700"
                }`}
              >
                <span
                  className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                    live ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                  }`}
                />
                <span>{live ? "Live" : "Reconnecting…"}</span>
              </div>
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          {error && (
            <div
              role="alert"
              className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <p className="flex-1 text-base text-red-700 font-medium">{error}</p>
              <button
                onClick={() => setError("")}
                aria-label="Dismiss"
                className="text-red-500 hover:text-red-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}
          {loading && (
            <p className="mb-4 text-base font-semibold text-slate-500">
              Loading this day's data…
            </p>
          )}

          {activeTab === "appointments" && (
            <AppointmentsTab
              appointments={appointments}
              doctors={doctorsList}
              slots={raw.slots}
              onArrive={markArrived}
              onDone={markDone}
              onWalkIn={addWalkIn}
            />
          )}
          {activeTab === "doctors" && <DoctorsTab doctors={doctorsList} />}
          {activeTab === "callLogs" && (
            <CallLogsTab callLogs={callLogs} onMarkCalled={markCalledBack} />
          )}
        </div>
      </main>
    </div>
  );
}
