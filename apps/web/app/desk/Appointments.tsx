import { useState } from "react";
import { ApiError, markArrived, maskPhone, timeOf, type Appointment } from "@/lib/api";
import { Empty, ErrorState, Loading } from "./States";

type Props = {
  token: string;
  items: Appointment[] | null;
  error: ApiError | null;
  loading: boolean;
  fresh: Set<number>;
  dateLabel: string;
  onRetry: () => void;
  onChanged: (a: Appointment) => void;
  onStale: () => void;
};

const STATUS_LABEL = { booked: "Booked", arrived: "Arrived", no_show: "No-show", cancelled: "Cancelled" } as const;
const SOURCE_LABEL = { helpline: "Helpline", app: "App", desk: "Desk" } as const;

type Pending = { phase: "pending" | "error" | "done"; msg?: string };

export default function Appointments(p: Props) {
  const [acts, setActs] = useState<Record<number, Pending>>({});
  const set = (id: number, v: Pending | null) =>
    setActs((a) => {
      const next = { ...a };
      if (v) next[id] = v;
      else delete next[id];
      return next;
    });

  async function arrive(a: Appointment) {
    set(a.id, { phase: "pending" });
    try {
      p.onChanged(await markArrived(p.token, a.id));
      set(a.id, { phase: "done", msg: "Marked arrived" });
      setTimeout(() => set(a.id, null), 3000);
    } catch (e) {
      const err = e as ApiError;
      set(a.id, { phase: "error", msg: err.kind === "network" ? "No connection. Try again." : err.message });
      if (err.status === 409) p.onStale();
    }
  }

  if (p.loading) return <Loading />;
  if (p.error && !p.items) return <ErrorState error={p.error} onRetry={p.onRetry} />;
  const items = p.items ?? [];

  const arrived = items.filter((a) => a.status === "arrived").length;
  const waiting = items.filter((a) => a.status === "booked").length;
  const head = (
    <header className="dayhead">
      <h1>{p.dateLabel}</h1>
      <p>
        {items.length === 0
          ? "No appointments today"
          : `${items.length} ${items.length === 1 ? "appointment" : "appointments"}, ${arrived} arrived, ${waiting} waiting`}
      </p>
    </header>
  );

  if (items.length === 0) {
    return (
      <>
        {head}
        <Empty icon="calendar" title="No appointments yet today" hint="New bookings from the helpline and the app appear here the moment they are made." />
      </>
    );
  }

  const byDoctor = new Map<number, { name: string; department: string; rows: Appointment[] }>();
  for (const a of items) {
    const g = byDoctor.get(a.doctor.id) ?? { name: a.doctor.name, department: a.doctor.department, rows: [] };
    g.rows.push(a);
    byDoctor.set(a.doctor.id, g);
  }

  return (
    <>
      {head}
      {[...byDoctor.entries()].map(([id, g]) => (
        <section className="doctor" key={id} aria-label={g.name}>
          <h2>{g.name}<small>{g.department}</small></h2>
          <ul className="rows">
            {g.rows.map((a) => {
              const act = acts[a.id];
              return (
                <li key={a.id} className={`row ${a.status}${p.fresh.has(a.id) ? " fresh" : ""}`}>
                  <div className="time">{timeOf(a.slot.start)}</div>
                  <div className="who">
                    <div>
                      <span className="name">{a.patient.name || "Name not given"}</span>
                      <span className="phone">{maskPhone(a.patient.phone)}</span>
                    </div>
                    {a.reason_text
                      ? <p className="reason">&ldquo;{a.reason_text}&rdquo;</p>
                      : <p className="reason none">No reason given</p>}
                  </div>
                  <div className="tags">
                    <span className={`badge ${a.source}`}>{SOURCE_LABEL[a.source]}</span>
                    <span className={`badge ${a.status}`}>
                      {STATUS_LABEL[a.status]}
                      {a.status === "arrived" && a.arrived_at ? ` ${timeOf(a.arrived_at)}` : ""}
                    </span>
                  </div>
                  <div className="action">
                    {a.status === "booked" && (
                      <button className="btn small" disabled={act?.phase === "pending"} onClick={() => arrive(a)}>
                        {act?.phase === "pending" ? <><span className="spinner" aria-hidden /> Saving</> : "Mark arrived"}
                      </button>
                    )}
                    {act?.phase === "error" && <span className="msg err" role="alert">{act.msg}</span>}
                    {act?.phase === "done" && <span className="msg" style={{ color: "var(--green)" }} role="status">{act.msg}</span>}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </>
  );
}
