import { useState } from "react";
import { ApiError, dateTimeOf, maskPhone, type Call } from "@/lib/api";
import { Empty, ErrorState, Loading } from "./States";

type Props = {
  items: Call[] | null;
  error: ApiError | null;
  loading: boolean;
  fresh: Set<number>;
  mode: "calls" | "handoffs";
  onRetry: () => void;
};

const LANG = { ta: "Tamil", hi: "Hindi", en: "English" } as const;
const OUTCOME = { booked: "Booked", info_given: "Info given", emergency: "Emergency", handed_off: "Handed off" } as const;

type Turn = { who: string; text: string };

// The API stores transcripts as JSON of any shape; show the common ones as turns, anything else as plain text.
function turnsOf(t: unknown): Turn[] {
  if (typeof t === "string") return t.trim() ? [{ who: "", text: t }] : [];
  const list = Array.isArray(t) ? t : t && typeof t === "object" && Array.isArray((t as { turns?: unknown }).turns) ? (t as { turns: unknown[] }).turns : null;
  if (!list) return t ? [{ who: "", text: JSON.stringify(t) }] : [];
  return list.map((x) => {
    if (typeof x === "string") return { who: "", text: x };
    const o = x as Record<string, unknown>;
    return { who: String(o.role ?? o.speaker ?? ""), text: String(o.text ?? o.content ?? o.message ?? "") };
  });
}

const isSahay = (who: string) => /assistant|sahay|agent|bot/i.test(who);

function CallItem({ c, fresh }: { c: Call; fresh: boolean }) {
  const [open, setOpen] = useState(false);
  const turns = turnsOf(c.transcript);
  const [day, ...rest] = dateTimeOf(c.started_at).split(", ");
  return (
    <li className={`call${c.emergency ? " emergency" : ""}${fresh ? " fresh" : ""}`}>
      <button className="call-head" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span className="when">{rest.join(", ") || day}<small>{rest.length ? day : ""}</small></span>
        <span className="sum">
          {c.summary || "No summary for this call"}
          <span className="phone">{c.patient_phone ? maskPhone(c.patient_phone) : "Unknown caller"}{c.duration_s != null ? `, ${Math.max(1, Math.round(c.duration_s / 60))} min` : ""}</span>
        </span>
        <span className="tags">
          {c.language && <span className="badge">{LANG[c.language]}</span>}
          {c.emergency && <span className="badge emergency">Emergency</span>}
          {c.outcome && !c.emergency && <span className="badge">{OUTCOME[c.outcome]}</span>}
        </span>
      </button>
      {open && (
        <div className="call-detail">
          <div>
            <h3>Transcript</h3>
            {turns.length === 0
              ? <p style={{ color: "var(--muted)" }}>No transcript was saved for this call.</p>
              : <div className="turns">
                  {turns.map((t, i) => (
                    <div key={i} className={`turn${isSahay(t.who) ? " sahay" : ""}`}>
                      {t.who && <b>{isSahay(t.who) ? "Sahay" : "Caller"}</b>}
                      {t.text}
                    </div>
                  ))}
                </div>}
          </div>
          {c.patient_phone && (
            <div className="call-actions">
              <a className="btn small" href={`tel:${c.patient_phone}`}>Call back</a>
            </div>
          )}
        </div>
      )}
    </li>
  );
}

export default function Calls(p: Props) {
  if (p.loading) return <Loading rows={3} />;
  if (p.error && !p.items) return <ErrorState error={p.error} onRetry={p.onRetry} />;
  const items = p.items ?? [];
  if (items.length === 0) {
    return p.mode === "handoffs"
      ? <Empty icon="check" title="No one is waiting for a person" hint="When a caller asks for a human or Sahay cannot help, the call waits here with the reason." />
      : <Empty icon="phone" title="No helpline calls yet" hint="Every call routed to this hospital is listed here with its transcript and summary." />;
  }
  return (
    <ul className="calls">
      {items.map((c) => <CallItem key={c.id} c={c} fresh={p.fresh.has(c.id)} />)}
    </ul>
  );
}
