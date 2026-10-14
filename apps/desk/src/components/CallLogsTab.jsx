import {
  PhoneIncoming,
  AlertTriangle,
  CheckCircle2,
  PhoneForwarded,
  Check,
  PhoneCall,
  ShieldAlert,
} from "lucide-react";

// ─── Language Badge ──────────────────────────────────
function LanguageBadge({ language }) {
  const map = {
    Tamil: "bg-purple-100 text-purple-900 border-purple-200",
    Hindi: "bg-orange-100 text-orange-900 border-orange-200",
    English: "bg-blue-100 text-blue-900 border-blue-200",
  };
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-base font-bold border ${
        map[language] || map.English
      }`}
    >
      {language}
    </span>
  );
}

// ─── Outcome Badge ───────────────────────────────────
function OutcomeBadge({ outcome }) {
  if (outcome === "Slot Booked") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-base font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
        Slot Booked
      </span>
    );
  }
  if (outcome === "Needs Callback") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-base font-bold bg-amber-50 text-amber-900 border border-amber-300">
        <PhoneForwarded className="w-5 h-5 text-amber-600 shrink-0" />
        Needs Callback
      </span>
    );
  }
  if (outcome === "Callback Completed") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-base font-bold bg-slate-100 text-slate-700 border border-slate-300">
        <Check className="w-5 h-5 text-emerald-600 shrink-0" />
        Callback Completed
      </span>
    );
  }
  if (outcome === "108 Emergency Redirected") {
    return (
      <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-base font-black bg-rose-100 text-rose-900 border border-rose-300">
        <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
        108 Emergency
      </span>
    );
  }
  return (
    <span className="text-base font-semibold text-slate-600">{outcome}</span>
  );
}

// ─── Main Component ──────────────────────────────────
export default function CallLogsTab({ callLogs, onMarkCalled }) {
  const pendingCallbacks = callLogs.filter(
    (l) => l.outcome === "Needs Callback"
  ).length;

  return (
    <div className="space-y-6">
      {/* ── Section Header & Callback Notice ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-sm">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-100 shrink-0">
              <PhoneIncoming className="w-6 h-6" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              Voice AI Helpline Call Logs
            </h2>
          </div>
          <p className="text-base text-slate-600">
            Calls handled by the Hello Sahay voice assistant for this hospital. Calls it could not finish appear as callbacks for the front desk.
          </p>
        </div>

        {pendingCallbacks > 0 && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-50 border-2 border-amber-300 text-amber-900 shrink-0 self-start sm:self-auto">
            <PhoneCall className="w-5 h-5 text-amber-600 animate-bounce shrink-0" />
            <span className="text-base font-black">
              {pendingCallbacks} Callback{pendingCallbacks > 1 ? "s" : ""} Pending
            </span>
          </div>
        )}
      </div>

      {/* ── Table Container (Fully Responsive with Touch Scroll) ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200">
                <th className="text-left py-4 px-5 text-sm font-black text-slate-700 uppercase tracking-wider">
                  Caller & Time
                </th>
                <th className="text-left py-4 px-5 text-sm font-black text-slate-700 uppercase tracking-wider">
                  Language
                </th>
                <th className="text-left py-4 px-5 text-sm font-black text-slate-700 uppercase tracking-wider">
                  Call Summary & Reason
                </th>
                <th className="text-left py-4 px-5 text-sm font-black text-slate-700 uppercase tracking-wider">
                  Outcome & Status
                </th>
                <th className="text-left py-4 px-5 text-sm font-black text-slate-700 uppercase tracking-wider">
                  Receptionist Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {callLogs.map((log) => (
                <tr
                  key={log.id}
                  className={`hover:bg-slate-50 transition-colors ${
                    log.outcome === "108 Emergency Redirected"
                      ? "bg-rose-50/40"
                      : log.outcome === "Needs Callback"
                      ? "bg-amber-50/20"
                      : ""
                  }`}
                >
                  {/* Caller Phone & Time */}
                  <td className="py-4 px-5 whitespace-nowrap">
                    <div className="text-lg font-bold font-mono text-slate-900">
                      {log.callerPhone}
                    </div>
                    <div className="text-base font-semibold text-slate-500 mt-0.5">
                      {log.time}
                    </div>
                  </td>

                  {/* Language */}
                  <td className="py-4 px-5 whitespace-nowrap">
                    <LanguageBadge language={log.language} />
                  </td>

                  {/* Call Summary */}
                  <td className="py-4 px-5">
                    <p className="text-base font-medium text-slate-800 leading-relaxed max-w-md">
                      {log.summary}
                    </p>
                  </td>

                  {/* Outcome */}
                  <td className="py-4 px-5 whitespace-nowrap">
                    <OutcomeBadge outcome={log.outcome} />
                  </td>

                  {/* Receptionist Action */}
                  <td className="py-4 px-5 whitespace-nowrap">
                    {log.outcome === "Needs Callback" ? (
                      <button
                        onClick={() => onMarkCalled(log.id)}
                        className="inline-flex items-center gap-2 px-4 py-2 text-base font-bold text-white bg-amber-600 hover:bg-amber-700 active:scale-95 rounded-xl shadow-sm transition-all"
                        title="Click once you have called back the patient"
                      >
                        <PhoneCall className="w-4 h-4 shrink-0" />
                        Mark Called
                      </button>
                    ) : log.outcome === "Callback Completed" ? (
                      <span className="inline-flex items-center gap-1.5 text-base font-bold text-emerald-700 bg-emerald-50 px-3.5 py-1.5 rounded-xl border border-emerald-200">
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                        Resolved
                      </span>
                    ) : log.outcome === "108 Emergency Redirected" ? (
                      <span className="inline-flex items-center gap-1.5 text-base font-bold text-rose-700 bg-rose-50 px-3.5 py-1.5 rounded-xl border border-rose-200">
                        <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                        Told to call 108
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-base font-medium text-slate-500">
                        <Check className="w-4 h-4 text-slate-400 shrink-0" />
                        {log.outcome === "Slot Booked" ? "Auto-Booked" : "No action needed"}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {callLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 px-5 text-center text-lg font-medium text-slate-500">
                    No calls yet. Calls to the Hello Sahay helpline will appear here as they happen.
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
