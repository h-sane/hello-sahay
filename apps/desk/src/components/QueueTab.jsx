import { useEffect, useState } from "react";
import { Plus, Clock } from "lucide-react";
import WalkInModal from "./WalkInModal";
import { LANG, clock, scheduleSummary } from "../mappers";

const BTN = "px-4 py-2.5 rounded-xl text-base font-bold transition-colors";
const PRIMARY = `${BTN} bg-blue-600 hover:bg-blue-700 text-white shadow-sm`;
const DONE = `${BTN} bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm`;
const QUIET = `${BTN} text-slate-600 hover:text-rose-700 hover:bg-rose-50 border border-slate-200`;

// One doctor's day: appointments are numbered A1, A2... in time order, walk-ins W1, W2... in arrival order.
// Cancelled appointments keep their number so the others never renumber under the receptionist.
export function laneOf(doctorId, appointments, walkIns, now) {
  const all = appointments
    .filter((a) => a.doctor.id === doctorId)
    .sort((a, b) => a.slot.start.localeCompare(b.slot.start) || a.id - b.id)
    .map((a, i) => ({ ...a, label: `A${i + 1}` }));
  const mine = all.filter((a) => a.status !== "cancelled");
  const walks = walkIns.filter((w) => w.doctor_id === doctorId);
  const waitingAppts = mine.filter((a) => a.status === "arrived");
  const coming = mine.filter((a) => a.status === "booked");
  // The next appointment the doctor owes someone: already here, or still ahead (a late no-show is not "next").
  const next = [...waitingAppts, ...coming]
    .filter((a) => a.status === "arrived" || new Date(a.slot.end) > now)
    .sort((a, b) => a.slot.start.localeCompare(b.slot.start))[0];
  return {
    inRoomAppt: mine.find((a) => a.status === "in_consult"),
    inRoomWalk: walks.find((w) => w.status === "in_consult"),
    waitingAppts,
    waitingWalks: walks.filter((w) => w.status === "waiting").sort((a, b) => a.number - b.number),
    coming,
    next,
    done: mine.filter((a) => a.status === "completed").length + walks.filter((w) => w.status === "done").length,
  };
}

// The sentence that tells the desk what to do with the doctor's time right now.
export function advice(lane, now) {
  const { next, waitingWalks } = lane;
  const busy = lane.inRoomAppt || lane.inRoomWalk;
  if (!next) {
    return { tone: "free", text: "No more appointments today. Walk-ins can go straight in." };
  }
  const who = `${next.label} ${next.patient.name || "patient"}`;
  const wait = new Date(next.slot.start) - now;
  if (wait <= 0) {
    return next.status === "arrived"
      ? { tone: "due", text: `${who} is here and their time has come. Call them in next.` }
      : { tone: "free", text: `${who} was due at ${clock(next.slot.start)} but has not arrived. Walk-ins can go in meanwhile.` };
  }
  const mins = Math.ceil(wait / 60000);
  return {
    tone: "free",
    text: `${mins} min free before ${next.label} at ${clock(next.slot.start)}.${
      waitingWalks.length && !busy ? ` Call in ${waitingWalks[0].label} ${waitingWalks[0].name}.` : ""
    }`,
  };
}

const TONE = {
  free: "bg-emerald-50 border-emerald-200 text-emerald-900",
  due: "bg-amber-50 border-amber-300 text-amber-900",
};

function Row({ label, kind, name, meta, children }) {
  return (
    <div className="flex flex-wrap items-center gap-3 py-3">
      <span
        className={`min-w-[3.25rem] text-center px-2.5 py-1 rounded-lg font-mono text-lg font-black ${
          kind === "walk" ? "bg-amber-100 text-amber-900" : "bg-blue-100 text-blue-800"
        }`}
      >
        {label}
      </span>
      <div className="min-w-0 flex-1 basis-40">
        <p className="text-lg font-bold text-slate-900 truncate">{name}</p>
        <p className="text-sm text-slate-500 truncate">{meta}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2">{children}</div>
    </div>
  );
}

function Section({ title, count, children }) {
  return (
    <div>
      <h4 className="text-sm font-black text-slate-500 mb-0.5">
        {title}
        {count !== undefined && <span className="ml-1.5 text-slate-400">{count}</span>}
      </h4>
      <div className="divide-y divide-slate-100">{children}</div>
    </div>
  );
}

function Lane({ doctor, lane, now, isDoctor, act }) {
  const tip = advice(lane, now);
  const inRoom = lane.inRoomAppt || lane.inRoomWalk;
  const minsAgo = (iso) => Math.max(0, Math.round((now - new Date(iso)) / 60000));
  return (
    <section
      className={`bg-white rounded-2xl border-2 p-5 sm:p-6 shadow-sm space-y-4 ${
        doctor.onDuty ? "border-slate-200" : "border-rose-200 bg-rose-50/20"
      }`}
    >
      <header>
        <div className="flex flex-wrap items-baseline justify-between gap-x-3">
          <h3 className="text-xl font-black text-slate-900">{doctor.name}</h3>
          <span className="text-base font-semibold text-blue-700">{doctor.specialty}</span>
        </div>
        <p className="text-sm text-slate-500 mt-0.5">
          {doctor.onDuty ? scheduleSummary(doctor.schedule) : "Off duty today: no new bookings or walk-ins"}
          {lane.done > 0 && ` · ${lane.done} seen today`}
        </p>
      </header>

      {doctor.onDuty && (
        <p className={`flex items-start gap-2.5 p-3.5 rounded-xl border text-base font-semibold ${TONE[tip.tone]}`}>
          <Clock className="w-5 h-5 shrink-0 mt-0.5" />
          {tip.text}
        </p>
      )}

      <Section title="With the doctor">
        {inRoom ? (
          <Row
            label={inRoom.label || `W${inRoom.number}`}
            kind={lane.inRoomAppt ? "appt" : "walk"}
            name={lane.inRoomAppt ? inRoom.patient.name || "Patient" : inRoom.name}
            meta={lane.inRoomAppt ? `Appointment ${clock(inRoom.slot.start)}` : `Walk-in, started ${minsAgo(inRoom.started_at)} min ago`}
          >
            <button
              className={DONE}
              onClick={() => (lane.inRoomAppt ? act.done(inRoom.id) : act.walk(inRoom.id, "done"))}
            >
              Done
            </button>
          </Row>
        ) : (
          <p className="py-3 text-base text-slate-500">Nobody in the room.</p>
        )}
      </Section>

      <Section title="Waiting" count={lane.waitingAppts.length + lane.waitingWalks.length}>
        {lane.waitingAppts.map((a) => (
          <Row key={`a${a.id}`} label={a.label} kind="appt" name={a.patient.name || "Patient"}
            meta={`Appointment ${clock(a.slot.start)} · arrived`}>
            <button className={PRIMARY} onClick={() => act.start(a.id)}>Call in</button>
          </Row>
        ))}
        {lane.waitingWalks.map((w) => (
          <Row key={`w${w.id}`} label={w.label} kind="walk" name={w.name}
            meta={`Walk-in · waiting ${minsAgo(w.created_at)} min${w.reason_text ? ` · ${w.reason_text}` : ""}`}>
            <button className={PRIMARY} onClick={() => act.walk(w.id, "start")}>Call in</button>
            {!isDoctor && <button className={QUIET} onClick={() => act.walk(w.id, "left")}>Left</button>}
          </Row>
        ))}
        {lane.waitingAppts.length + lane.waitingWalks.length === 0 && (
          <p className="py-3 text-base text-slate-500">Nobody is waiting.</p>
        )}
      </Section>

      {lane.coming.length > 0 && (
        <Section title="Booked, not here yet" count={lane.coming.length}>
          {lane.coming.map((a) => {
            const late = new Date(a.slot.end) <= now;
            return (
              <Row key={a.id} label={a.label} kind="appt" name={a.patient.name || "Patient"}
                meta={`${clock(a.slot.start)}${late ? " · time has passed" : ""}${LANG[a.patient.language] ? ` · ${LANG[a.patient.language]}` : ""}`}>
                {!isDoctor && (
                  <>
                    <button className={PRIMARY} onClick={() => act.arrive(a.id)}>Mark arrived</button>
                    <button className={QUIET} onClick={() => act.noShow(a.id)}>No-show</button>
                  </>
                )}
              </Row>
            );
          })}
        </Section>
      )}
    </section>
  );
}

export default function QueueTab({ appointments, walkIns, doctors, isDoctor, act }) {
  const [now, setNow] = useState(() => new Date());
  const [showModal, setShowModal] = useState(false);
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  const waiting = walkIns.filter((w) => w.status === "waiting").length;
  const onDuty = doctors.filter((d) => d.onDuty);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div>
          <h2 className="text-2xl font-black text-slate-900">Today at the counter</h2>
          <p className="text-base text-slate-600 mt-1">
            Appointments (A) keep their time. Walk-ins (W) go in during the breaks, or when a visit ends early.
            {waiting > 0 && <strong className="text-amber-800"> {waiting} walk-in{waiting > 1 ? "s" : ""} waiting.</strong>}
          </p>
        </div>
        {!isDoctor && (
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-700 text-white text-lg font-bold rounded-xl shadow-sm transition-colors shrink-0"
          >
            <Plus className="w-6 h-6" />
            Add walk-in
          </button>
        )}
      </div>

      {doctors.length === 0 && (
        <p className="py-12 text-center text-lg font-medium text-slate-500">
          No doctors are set up for this hospital yet. Add doctor logins in the Users tab.
        </p>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 items-start">
        {doctors.map((d) => (
          <Lane key={d.id} doctor={d} lane={laneOf(d.id, appointments, walkIns, now)} now={now}
            isDoctor={isDoctor} act={act} />
        ))}
      </div>

      {showModal && <WalkInModal doctors={onDuty} onClose={() => setShowModal(false)} onAdd={act.addWalkIn} />}
    </div>
  );
}
