import { useEffect, useRef, useState } from "react";
import { WS_BASE, type Appointment, type Call } from "./api";

export type LiveMessage = { type: "appointment"; appointment: Appointment } | { type: "call"; call: Call };
export type LiveState = "connecting" | "live" | "reconnecting";

// Keeps one socket open for the facility and reconnects with a growing pause (1s up to 10s).
// onOpen fires on every (re)connect so callers can refetch what they missed.
export function useDeskSocket(
  facilityId: number | null,
  token: string | null,
  onMessage: (m: LiveMessage) => void,
  onOpen: () => void,
): LiveState {
  const [state, setState] = useState<LiveState>("connecting");
  const handlers = useRef({ onMessage, onOpen });
  handlers.current = { onMessage, onOpen };

  useEffect(() => {
    if (facilityId == null || !token) return;
    let ws: WebSocket | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let attempt = 0;
    let closed = false;

    const connect = () => {
      ws = new WebSocket(`${WS_BASE}/live/desk/${facilityId}?token=${encodeURIComponent(token)}`);
      ws.onopen = () => {
        attempt = 0;
        setState("live");
        handlers.current.onOpen();
      };
      ws.onmessage = (e) => {
        try {
          const m = JSON.parse(e.data);
          if (m?.type === "appointment" || m?.type === "call") handlers.current.onMessage(m);
        } catch {}
      };
      ws.onclose = () => {
        if (closed) return;
        setState("reconnecting");
        timer = setTimeout(connect, Math.min(10000, 1000 * 2 ** attempt++));
      };
    };
    connect();
    return () => {
      closed = true;
      clearTimeout(timer);
      ws?.close();
    };
  }, [facilityId, token]);

  return state;
}
