import type { ApiError } from "@/lib/api";

const paths = {
  calendar: "M7 3v3m10-3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z",
  phone: "M6 3h3l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 4 5a2 2 0 0 1 2-2Z",
  check: "M5 12.5 10 17.5 19 7",
  offline: "M3 3l18 18M8.5 8.6A10 10 0 0 0 3 12m4 3.5a6 6 0 0 1 4-2m-6.7-.6M12 19h.01M16.3 12.6A10 10 0 0 0 12 11",
};

function Glyph({ name }: { name: keyof typeof paths }) {
  return (
    <svg className="glyph" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d={paths[name]} />
    </svg>
  );
}

export function Loading({ rows = 4 }: { rows?: number }) {
  return (
    <div role="status" aria-label="Loading" style={{ display: "grid", gap: 10 }}>
      {Array.from({ length: rows }, (_, i) => <div key={i} className="skeleton" />)}
    </div>
  );
}

export function Empty({ icon, title, hint }: { icon: keyof typeof paths; title: string; hint: string }) {
  return (
    <div className="state">
      <Glyph name={icon} />
      <h2>{title}</h2>
      <p>{hint}</p>
    </div>
  );
}

export function ErrorState({ error, onRetry }: { error: ApiError; onRetry: () => void }) {
  const offline = error.kind === "network";
  return (
    <div className="state error" role="alert">
      <Glyph name="offline" />
      <h2>{offline ? "Cannot reach the Sahay server" : "Could not load this list"}</h2>
      <p>
        {offline
          ? "Check that this computer is online. Your list will refresh as soon as the connection is back."
          : error.message}
      </p>
      <button className="btn" onClick={onRetry}>Try again</button>
    </div>
  );
}
