# apps/admin — Hello Sahay admin console

For the Hello Sahay team only (not hospitals). One static `index.html`, no build step.
Screens: Overview, Hospitals, Hospital logins (create the hospital admin login for a partner hospital, reset passwords, switch logins off), Payments, Calls (every transcript, urgency tag and callback status, including callers with no hospital; the voice AI call logs live here, not in Sahay Desk), Care plan.

Data comes from `GET /api/v1/admin/*` (`services/api/app/routers/admin.py`), admin token only.
Subscription and arrival-fee lines (priced by each hospital's `plan`: clinic ₹999 + ₹30, nursing_home ₹2,499 + ₹50, hospital ₹4,999 + ₹50; an unset plan bills as nursing_home) are derived from the partner flag and arrived appointments.

Run locally: serve this folder with any static server that proxies `/api` to the API on :8001.
Live: `https://hellosahay.<ip-dashed>.sslip.io`, also `https://admin.<ip-dashed>.sslip.io` (see `deploy/README.md`). Demo login `admin@sahay.demo` / `demo1234`.
