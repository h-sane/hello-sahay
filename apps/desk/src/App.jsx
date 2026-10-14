import { useState } from "react";
import Navbar from "./components/Navbar";
import AppointmentsTab from "./components/AppointmentsTab";
import DoctorsTab from "./components/DoctorsTab";
import CallLogsTab from "./components/CallLogsTab";
import LoginPage from "./components/LoginPage";
import { hospitals } from "./data/mockData";
import { MapPin, Calendar, Menu, Activity } from "lucide-react";

export default function App() {
  // Authentication & Hospital Selection State (Defaults to login page)
  const [currentHospitalId, setCurrentHospitalId] = useState(null);

  // Mobile navigation drawer state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Per-hospital isolated state
  const [appointments, setAppointments] = useState([]);
  const [doctorsList, setDoctorsList] = useState([]);
  const [callLogsList, setCallLogsList] = useState([]);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState("appointments");

  // Login handler: switches to the selected hospital and initializes its distinct dataset
  const handleLogin = (hospitalId) => {
    const selected = hospitals[hospitalId] || hospitals.kaveri;
    setCurrentHospitalId(selected.id);
    setAppointments([...selected.appointments]);
    setDoctorsList([...selected.doctors]);
    setCallLogsList([...selected.callLogs]);
    setActiveTab("appointments");
    setMobileMenuOpen(false);
  };

  // Logout handler: returns to the login screen
  const handleLogout = () => {
    setCurrentHospitalId(null);
    setMobileMenuOpen(false);
  };

  // If not logged in, show the Hospital Login Page
  if (!currentHospitalId) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const currentHospital = hospitals[currentHospitalId];

  // Tab title map
  const tabTitles = {
    appointments: "Appointments & Live Queue",
    doctors: "Doctor Availability & Roster",
    callLogs: "Voice AI Helpline Call Logs",
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      {/* ── Responsive Sidebar Drawer (w-80, slide-in on mobile, fixed on lg) ── */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentHospital={currentHospital}
        onLogout={handleLogout}
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* ── Main Content Canvas (ml-0 on mobile, ml-80 on laptop/desktop) ── */}
      <main className="flex-1 ml-0 lg:ml-80 min-w-0 transition-all">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-6 lg:px-8 py-3.5 sm:py-5 shadow-xs">
          <div className="flex items-center justify-between gap-3">
            {/* Left: Mobile Menu Toggle + Facility Identity & Title */}
            <div className="flex items-center gap-3 min-w-0">
              {/* Hamburger Button for Mobile & Tablets */}
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
                    {currentHospital.planBadge || currentHospital.plan}
                  </span>
                </div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 tracking-tight truncate">
                  {tabTitles[activeTab]}
                </h1>
              </div>
            </div>

            {/* Right: Date Badge & Online Indicator */}
            <div className="flex items-center gap-3 sm:gap-4 text-sm sm:text-base font-semibold text-slate-600 bg-slate-50 px-3 sm:px-4 py-2 rounded-xl border border-slate-200 shrink-0">
              <div className="hidden sm:flex items-center gap-2">
                <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 shrink-0" />
                <span className="whitespace-nowrap">
                  {new Date().toLocaleDateString("en-IN", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                  })}
                </span>
              </div>
              <span className="hidden sm:inline text-slate-300">|</span>
              <div className="flex items-center gap-1.5 text-emerald-700 font-bold whitespace-nowrap">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                <span>Live Reception</span>
              </div>
            </div>
          </div>
        </header>

        {/* Tab Canvas Area with Fluid Responsive Padding */}
        <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
          {activeTab === "appointments" && (
            <AppointmentsTab
              appointments={appointments}
              setAppointments={setAppointments}
              doctors={doctorsList}
            />
          )}

          {activeTab === "doctors" && (
            <DoctorsTab
              doctors={doctorsList}
              setDoctors={setDoctorsList}
            />
          )}

          {activeTab === "callLogs" && (
            <CallLogsTab
              callLogs={callLogsList}
              setCallLogs={setCallLogsList}
            />
          )}
        </div>
      </main>
    </div>
  );
}
