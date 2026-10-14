# apps/admin — Hello Sahay admin console

For the Hello Sahay team only (not hospitals). One static `index.html`, no build step.
Screens: Overview, Hospitals, Payments, Calls (every transcript, including callers with no hospital), Care plan.

Data comes from `GET /api/v1/admin/*` (`services/api/app/routers/admin.py`), admin token only.
Subscription (₹2,999) and arrival-fee (₹40) lines are derived from the partner flag and arrived appointments.

Run locally: serve this folder with any static server that proxies `/api` to the API on :8001.
Live: `https://admin.<ip-dashed>.sslip.io` (see `deploy/README.md`). Demo login `admin@sahay.demo` / `demo1234`.
