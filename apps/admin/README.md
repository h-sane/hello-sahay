# apps/admin — Hello Sahay admin console

For the Hello Sahay team only (not hospitals). One static `index.html`, no build step.
Screens: Overview, Hospitals, Hospital logins (create the hospital admin login for a partner hospital, reset passwords, switch logins off), Payments, Calls (every transcript, including callers with no hospital), Care plan.

Data comes from `GET /api/v1/admin/*` (`services/api/app/routers/admin.py`), admin token only.
Subscription and arrival-fee lines (flat ₹2,999 and ₹40 in the demo; tiers are proposed in `docs/BUSINESS.md`) are derived from the partner flag and arrived appointments.

Run locally: serve this folder with any static server that proxies `/api` to the API on :8001.
Live: `https://hellosahay.<ip-dashed>.sslip.io`, also `https://admin.<ip-dashed>.sslip.io` (see `deploy/README.md`). Demo login `admin@sahay.demo` / `demo1234`.
