import {
  Calendar,
  Users,
  PhoneIncoming,
  Activity,
  LogOut,
  Building2,
  X,
} from "lucide-react";

const tabs = [
  { id: "appointments", label: "Appointments & Schedule", icon: Calendar },
  { id: "doctors", label: "Doctor Availability", icon: Users },
  { id: "callLogs", label: "Voice AI Call Logs", icon: PhoneIncoming },
];

export default function Navbar({
  activeTab,
  setActiveTab,
  currentHospital,
  onLogout,
  isOpen,
  onClose,
}) {
  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Responsive Slide-over Sidebar Drawer */}
      <aside
        className={`fixed top-0 left-0 h-screen w-80 bg-white border-r border-slate-200 flex flex-col z-50 shadow-xl lg:shadow-sm transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 sm:p-6 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-sm shrink-0">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight leading-none">
                Sahay Desk
              </h1>
              <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mt-1">
                Hospital Portal
              </p>
            </div>
          </div>

          {/* Close button for Mobile / Tablet */}
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            aria-label="Close navigation menu"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Hospital Identity & Plan Info Card */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50/70">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-blue-100 text-blue-700 shrink-0 mt-0.5">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2
                className="text-base font-bold text-slate-900 leading-snug truncate"
                title={currentHospital.name}
              >
                {currentHospital.name}
              </h2>
              <p
                className="text-xs font-mono text-slate-500 truncate mt-0.5"
                title={currentHospital.email}
              >
                {currentHospital.email}
              </p>
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
                  {currentHospital.planBadge || currentHospital.plan}
                </span>
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Online
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <p className="px-3 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
            Portal Navigation
          </p>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  onClose?.();
                }}
                className={`w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl text-base font-bold transition-all text-left ${
                  isActive
                    ? "bg-blue-600 text-white shadow-md shadow-blue-200"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Icon
                  className={`w-5 h-5 shrink-0 ${
                    isActive ? "text-white" : "text-slate-500"
                  }`}
                />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Sign Out Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50/50">
          <button
            onClick={() => {
              onLogout();
              onClose?.();
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-base font-bold text-slate-700 hover:text-red-700 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-200 transition-colors shadow-sm"
          >
            <LogOut className="w-5 h-5 text-slate-500 group-hover:text-red-600 shrink-0" />
            Sign Out Facility
          </button>
          <p className="text-center text-xs text-slate-400 mt-2.5">
            Sahay Desk · Clinical Information System
          </p>
        </div>
      </aside>
    </>
  );
}
