# Sahay Desk (Vite)

Hospital dashboard from a teammate's prototype, wired to the Hello Sahay API. Endpoint map: `docs/FRONTEND_INTEGRATION.md`.

```bash
npm install && npm run dev      # http://localhost:5173, proxies /api to :8001
```

Needs the API running and the demo hospital seeded (`python scripts/load_seed.py`).

## Who sees what

| Login | Tabs |
|---|---|
| Hospital admin (`desk7@sahay.demo`) | Appointments, Doctors, Call logs, Past visits, **Users** |
| Receptionist / nurse (`reception@sunrise.demo`, `nurse@sunrise.demo`) | Appointments, Doctors, Call logs, Past visits |
| Doctor (`harini@sunrise.demo`, `karthik@sunrise.demo`, ...) | My appointments, My past patients (only their own; no walk-ins, no calls) |

Password for every demo login: `demo1234`. The Hello Sahay team account (`admin@sahay.demo`) is refused here; it uses the admin console.
The hospital admin adds receptionist, nurse and doctor logins in the **Users** tab (the password is shown once, can be reset later).
Times and "today" use Indian time whatever the computer's clock says. Set `SAHAY_API_ORIGIN` if the API is elsewhere, `VITE_API_URL` for a hosted build.
