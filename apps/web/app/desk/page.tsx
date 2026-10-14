"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  dayLabel, dayOf, listAppointments, listCalls, listHandoffs, todayIST,
  type Appointment, type Call, type Session,
} from "@/lib/api";
import { getSession, setSession } from "@/lib/session";
import { useDeskSocket, type LiveMessage } from "@/lib/useDeskSocket";
import { useLoad } from "@/lib/useLoad";
import Appointments from "./Appointments";
import Calls from "./Calls";

type Tab = "today" | "calls" | "handoffs";

const byTime = (a: Appointment, b: Appointment) => a.slot.start.localeCompare(b.slot.start);

function upsert<T extends { id: number }>(list: T[] | null, item: T, order: (a: T, b: T) => number): T[] {
  const rest = (list ?? []).filter((x) => x.id !== item.id);
  return [...rest, item].sort(order);
}

export default function DeskPage() {
  const router = useRouter();
  const [session, setSess] = useState<Session | null>(null);
  const [tab, setTab] = useState<Tab>("today");

  useEffect(() => {
    const s = getSession();
    if (!s || s.facility_id == null) router.replace("/desk/login");
    else setSess(s);
  }, [router]);

  const signOut = useCallback(() => {
    setSession(null);
    router.replace("/desk/login");
  }, [router]);

  if (!session) return null;
  return <Desk session={session} tab={tab} setTab={setTab} signOut={signOut} />;
}

function Desk({ session, tab, setTab, signOut }: { session: Session; tab: Tab; setTab: (t: Tab) => void; signOut: () => void }) {
  const { token } = session;
  const facilityId = session.facility_id as number;
  const [today, setToday] = useState(todayIST);

  const appts = useLoad(() => listAppointments(token, today), signOut);
  const calls = useLoad(() => listCalls(token, facilityId), signOut);
  const handoffs = useLoad(() => listHandoffs(token), signOut);

  // Rows that just arrived or changed over the socket glow for a few seconds.
  const [fresh, setFresh] = useState<{ appt: Set<number>; call: Set<number> }>({ appt: new Set(), call: new Set() });
  const flash = useCallback((kind: "appt" | "call", id: number) => {
    setFresh((f) => ({ ...f, [kind]: new Set(f[kind]).add(id) }));
    setTimeout(() => setFresh((f) => {
      const s = new Set(f[kind]);
      s.delete(id);
      return { ...f, [kind]: s };
    }), 4000);
  }, []);

  const onMessage = useCallback((m: LiveMessage) => {
    if (m.type === "appointment") {
      const a = m.appointment;
      appts.setData((list) =>
        dayOf(a.slot.start) === today ? upsert(list, a, byTime) : (list ?? []).filter((x) => x.id !== a.id));
      if (dayOf(a.slot.start) === today) flash("appt", a.id);
    } else {
      const c = m.call;
      calls.setData((list) => upsert(list, c, (x, y) => y.started_at.localeCompare(x.started_at)));
      if (c.handoff) handoffs.setData((list) => upsert(list, c, (x, y) => y.started_at.localeCompare(x.started_at)));
      flash("call", c.id);
    }
  }, [today, flash]); // eslint-disable-line react-hooks/exhaustive-deps

  const refreshAll = useCallback(() => {
    appts.refresh();
    calls.refresh();
    handoffs.refresh();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const live = useDeskSocket(facilityId, token, onMessage, refreshAll);

  // Midnight rollover: switch to the new day without a reload.
  useEffect(() => {
    const t = setInterval(() => {
      const d = todayIST();
      if (d !== today) setToday(d);
    }, 60_000);
    return () => clearInterval(t);
  }, [today]);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) first.current = false;
    else appts.reload();
  }, [today]); // eslint-disable-line react-hooks/exhaustive-deps

  const facilityName = appts.data?.[0]?.facility.name ?? `Hospital ${facilityId}`;
  const waiting = handoffs.data?.length ?? 0;

  return (
    <>
      <header className="topbar">
        <div className="topbar-inner">
          <span className="wordmark">Sahay Desk</span>
          <span className="facility">{facilityName}</span>
          <span className="spacer" />
          <span className={`conn ${live}`} role="status">
            <span className="dot" aria-hidden />
            {live === "live" ? "Live" : live === "connecting" ? "Connecting" : "Reconnecting"}
          </span>
          <button className="link-btn" onClick={signOut}>Sign out</button>
        </div>
        <nav className="tabs" role="tablist" aria-label="Desk sections">
          <button className="tab" role="tab" aria-selected={tab === "today"} onClick={() => setTab("today")}>
            Today <span className="count">{appts.data?.length ?? "-"}</span>
          </button>
          <button className="tab" role="tab" aria-selected={tab === "calls"} onClick={() => setTab("calls")}>
            Call transcripts <span className="count">{calls.data?.length ?? "-"}</span>
          </button>
          <button className="tab" role="tab" aria-selected={tab === "handoffs"} onClick={() => setTab("handoffs")}>
            Handoff queue <span className={`count${waiting ? " alert" : ""}`}>{handoffs.data ? waiting : "-"}</span>
          </button>
        </nav>
      </header>

      <main className="page">
        {live === "reconnecting" && (
          <p className="banner" role="status">Live updates paused. Reconnecting; the list refreshes when it is back.</p>
        )}
        {tab === "today" && (
          <Appointments
            token={token}
            items={appts.data}
            error={appts.error}
            loading={appts.loading}
            fresh={fresh.appt}
            dateLabel={dayLabel(today)}
            onRetry={appts.reload}
            onChanged={(a) => appts.setData((l) => upsert(l, a, byTime))}
            onStale={appts.refresh}
          />
        )}
        {tab === "calls" && (
          <Calls mode="calls" items={calls.data} error={calls.error} loading={calls.loading} fresh={fresh.call} onRetry={calls.reload} />
        )}
        {tab === "handoffs" && (
          <Calls mode="handoffs" items={handoffs.data} error={handoffs.error} loading={handoffs.loading} fresh={fresh.call} onRetry={handoffs.reload} />
        )}
      </main>
    </>
  );
}
