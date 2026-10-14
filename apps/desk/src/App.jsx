import { useCallback, useEffect, useRef, useState } from "react";
import Navbar from "./components/Navbar";
import AppointmentsTab from "./components/AppointmentsTab";
import DoctorsTab from "./components/DoctorsTab";
import CallLogsTab from "./components/CallLogsTab";
import HistoryTab from "./components/HistoryTab";
import UsersTab from "./components/UsersTab";
import LoginPage from "./components/LoginPage";
import { api, liveSocketUrl, session as sessionStore } from "./api";
import { ROLE_LABEL, todayIST, toCallRow, toDoctor, toRow } from "./mappers";
import { MapPin, Menu, AlertCircle, X, ChevronLeft, ChevronRight } from "lucide-react";

const TYPE_LABEL = {
  PHC: "Primary Health Centre",
  CHC: "Community Health Centre",
  GH: "Government Hospital",
  private: "Private facility",
};

// What each role may open. The API enforces the same rules; this only decides what to show.
const TABS_FOR = {
  hospital_admin: ["appointments", "doctors", "callLogs", "history", "users"],
  receptionist: ["appointments", "doctors", "callLogs", "history"],
  nurse: ["appointments", "doctors", "callLogs", "history"],
  doctor: ["appointments", "history"],
};

const isoDay = (d) => d.toLocaleDateString("en-CA");
const shiftDay = (iso, by) => {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + by);
  return isoDay(d);
};

export default function App() {
  const [auth, setAuth] = useState(sessionStore.get());
  const [hospital, setHospital] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("appointments");
  const [day, setDay] = useState(todayIST());
  const [raw, setRaw] = useState({ appointments: [], doctors: [], calls: [], history: [] });
  const [loading, setLoading] = useState(false);
  const [live, setLive] = useState(false);
  const [error, setError] = useState("");

  const facilityId = auth?.facility_id;
  const role = auth?.role;
  const isDoctor = role === "doctor";
  const tabs = TABS_FOR[role] || [];

  const logout = useCallback(() => {
    sessionStore.clear();
    setAuth(null);
    setHospital(null);
    setLive(false);
    setActiveTab("appointments");
    setMobileMenuOpen(false);
  }, []);

  const fail = useCallback(
    (e) => {
      if (e.status === 401) return logout();
      setError(e.message || "Something went wrong. Please try again.");
    },
    [logout]
  );

  // The tab and role are read inside refresh through refs, so a live push refetches only what is on screen.
  const tabRef = useRef(activeTab);
  tabRef.current = activeTab;

  const refresh = useCallback(async () => {
    if (!facilityId) return;
    try {
      const [appointments, doctors, calls, history] = await Promise.all([
        api.appointments(day),
        isDoctor ? [] : api.doctors(day),
        isDoctor ? [] : api.calls(),
        tabRef.current === "history" ? api.history() : null,
      ]);
      setRaw((prev) => ({ appointments, doctors, calls, history: history ?? prev.history }));
    } catch (e) {
      fail(e);
    }
  }, [facilityId, day, isDoctor, fail]);

  const handleLogin = async (email, password) => {
    const res = await api.login(email, password);
    if (!TABS_FOR[res.role]) {
      throw new Error(
        "This is a Hello Sahay team account. Use the admin console, or sign in with a hospital account."
      );
    }
    const next = {
      token: res.token,
      role: res.role,
      facility_id: res.facility_id,
      doctor_id: res.doctor_id,
      name: res.name,
      email: res.email || email,
    };
    sessionStore.set(next);
    setAuth(next);
  };

  // On sign-in (or a reload with a stored session): which hospital this is.
  useEffect(() => {
    if (!facilityId) return;
    api
      .facilities()
      .then((list) => {
        const f = list.find((x) => x.id === facilityId);
        setHospital({
          name: f?.name || `Facility ${facilityId}`,
          email: auth.email || "",
          userName: auth.name || ROLE_LABEL[role],
          roleLabel: ROLE_LABEL[role] || role,
          planBadge: TYPE_LABEL[f?.type] || "Partner facility",
          departments: f?.departments || [],
        });
      })
      .catch(fail);
  }, [facilityId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Refetch on first load, when the viewed day changes and when the history tab opens.
  useEffect(() => {
    if (!facilityId) return;
    setLoading(true);
    refresh().finally(() => setLoading(false));
  }, [refresh, activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

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

  // Runs a write, shows its error, and always refetches so the screen matches the server.
  const run = async (action) => {
    setError("");
    try {
      await action();
    } catch (e) {
      fail(e);
    }
    await refresh();
  };

  const markArrived = (id) => run(() => api.act(id, "arrived"));
  const markDone = (id) => run(() => api.act(id, "complete"));
  const markNoShow = (id) => run(() => api.act(id, "no_show"));
  const markCalledBack = (id) => run(() => api.callbackDone(id));
  const toggleDuty = (id, onDuty) => run(() => api.setDuty(id, onDuty));

  // A walk-in is at the counter now, so it lands on today's queue whatever day is on screen.
  const addWalkIn = async ({ name, phone, doctorId, reason }) => {
    await api.walkIn({
      patient: { name, phone },
      doctor_id: doctorId,
      reason_text: reason || null,
    });
    setDay(todayIST());
    await refresh();
  };

  // A stored session from before roles existed has no usable role: back to sign-in.
  if (!auth || !TABS_FOR[role]) return <LoginPage onLogin={handleLogin} />;
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
  const appointments = raw.appointments.map((a) => toRow(a, tokenOf.get(a.id) ?? "–"));
  const callLogs = raw.calls.map(toCallRow);
  const doctorsList = raw.doctors.map(toDoctor);
  const pastVisits = raw.history.map((a) => toRow(a, "–"));

  const tabTitles = {
    appointments: isDoctor ? "My Appointments" : "Appointments & Live Queue",
    doctors: "Doctors & Open Slots",
    callLogs: "Voice AI Helpline Call Logs",
    history: isDoctor ? "My Past Patients" : "Past Visits",
    users: "Staff Logins",
  };
  const showDay = activeTab === "appointments" || activeTab === "doctors";

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <Navbar
        tabs={tabs}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentHospital={hospital}
        isDoctor={isDoctor}
        onLogout={logout}
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      <main className="flex-1 ml-0 lg:ml-80 min-w-0 transition-all">
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-3.5 sm:py-5 shadow-xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1 basis-60">
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
                  <span className="truncate">{hospital.name}</span>
                  <span className="hidden sm:inline">·</span>
                  <span className="hidden sm:inline font-bold text-blue-700">
                    {hospital.planBadge}
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight truncate">
                  {tabTitles[activeTab]}
                </h1>
              </div>
            </div>

            <div className="flex items-center gap-3 sm:gap-4 text-sm sm:text-base font-semibold text-slate-600 bg-slate-50 px-3 sm:px-4 py-2 rounded-xl border border-slate-200 shrink-0">
              {showDay && (
                <>
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
                </>
              )}
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
          {loading && showDay && (
            <p className="mb-4 text-base font-semibold text-slate-500">
              Loading this day's data…
            </p>
          )}

          {activeTab === "appointments" && (
            <AppointmentsTab
              appointments={appointments}
              doctors={doctorsList}
              isDoctor={isDoctor}
              onArrive={markArrived}
              onDone={markDone}
              onNoShow={markNoShow}
              onWalkIn={addWalkIn}
            />
          )}
          {activeTab === "doctors" && (
            <DoctorsTab doctors={doctorsList} onToggleDuty={toggleDuty} />
          )}
          {activeTab === "callLogs" && (
            <CallLogsTab callLogs={callLogs} onMarkCalled={markCalledBack} />
          )}
          {activeTab === "history" && (
            <HistoryTab visits={pastVisits} isDoctor={isDoctor} />
          )}
          {activeTab === "users" && (
            <UsersTab
              self={auth.email}
              doctors={doctorsList}
              departments={hospital.departments}
              onError={fail}
              onChanged={refresh}
            />
          )}
        </div>
      </main>
    </div>
  );
}
