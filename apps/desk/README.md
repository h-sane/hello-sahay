# Sahay Desk (Vite)

Hospital dashboard from a teammate's prototype, wired to the Hello Sahay API. Endpoint map: `docs/FRONTEND_INTEGRATION.md`.

```bash
npm install && npm run dev      # http://localhost:5173, proxies /api to :8001
```

Needs the API running and the demo hospital seeded (`python scripts/load_seed.py`).

## Who sees what

| Login | Tabs |
|---|---|
| Hospital admin (`desk7@sahay.demo`) | Live queue, Appointments, Doctors & timetables, Call logs, Past visits, **Users** |
| Receptionist / nurse (`reception@sunrise.demo`, `nurse@sunrise.demo`) | Live queue, Appointments, Doctors & timetables, Call logs, Past visits |
| Doctor (`harini@sunrise.demo`, `karthik@sunrise.demo`, ...) | My queue, My appointments, My past patients (only their own; they call patients in and finish visits, but cannot add walk-ins, mark arrivals, edit timetables or see calls) |

**Timetables and walk-ins.** Each doctor has a timetable (Doctors & timetables, "Set timetable"): *appointments only* (slots back to back) or *appointments and walk-ins* (after every few slots a break with no slot, e.g. 3 slots of 20 minutes, then a 20-minute break). The helpline and patient app only ever see real slots, so break time cannot be booked; booked slots are never moved when a timetable changes. A doctor nobody has configured keeps the standard demo timetable (15-minute slots, 09:00-13:00 and 16:00-18:00, one weekly day off, a third of slots pre-taken). The **Live queue** tab is one lane per doctor for today: appointments are A1, A2... in time order, walk-ins W1, W2... in arrival order (the number restarts each day and is only an internal marker). The lane says how long the doctor is free before the next appointment and who to call in; "Call in" and "Done" track who is in the room, so time saved by a short visit goes to the waiting walk-ins.

Password for every demo login: `demo1234`. The Hello Sahay team account (`admin@sahay.demo`) is refused here; it uses the admin console.
The hospital admin adds receptionist, nurse and doctor logins in the **Users** tab (the password is shown once, can be reset later).
Times and "today" use Indian time whatever the computer's clock says. Set `SAHAY_API_ORIGIN` if the API is elsewhere, `VITE_API_URL` for a hosted build.
