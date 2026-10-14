# apps/web — Sahay Desk + Admin + browser call demo (Next.js)

Routes: `/desk` (hospital staff), `/admin` (our team), `/call` (browser "Call Sahay").
Screens: `docs/FRONTEND_DELIVERABLES.md` §B and §C. Task cards: P1-11, P2-5.

## Run

```
cd apps/web
npm install
cp .env.example .env.local      # NEXT_PUBLIC_API_BASE_URL, default http://localhost:8001/api/v1
npm run dev                     # http://localhost:3000/desk
npm run build                   # production build check
```

Needs the API on port 8001. Demo login: `desk7@sahay.demo` / `demo1234` (the hospital admin of the demo hospital). This is the earlier Desk; the Vite Sahay Desk in `apps/desk` has the role-based tabs.

## Sahay Desk (`/desk`)

- `/desk/login`: email and password, token kept in memory and `sessionStorage`.
- `/desk`: today's appointments grouped by doctor, with a "Mark arrived" button (triggers the arrival fee), call transcripts, and the handoff queue.
- Live updates over `WS /live/desk/{facility_id}`; the connection dot shows live or reconnecting, and the lists refetch on every reconnect.
