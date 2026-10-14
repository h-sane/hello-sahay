# data/seed - DEMO DATA

Everything here is **fictional demo data** (task card P1-2). Facility names, doctors and phone numbers are invented and must stay labelled as demo data. Each CSV starts with a `# DEMO DATA` comment line, which the loader skips.

Demo district: Chengalpattu (Tamil Nadu), around Chengalpattu, Madurantakam and Thirukazhukundram.

| File | Contents |
|---|---|
| `facilities.csv` | 10 facilities: 4 PHC, 1 CHC, 1 GH, 4 private. **Exactly one, Sunrise Nursing Home, is `is_partner=true` (plan `sahay_desk`): it is the one demo hospital whose Sahay Desk receives every booking and call.** The other three private ones are listed but not partners; government facilities are never partners. Columns follow the `facility` table in `docs/ARCHITECTURE.md` section 4; `departments` is pipe-separated. |
| `doctors.csv` | 2-4 fictional doctors per facility, linked by `facility_name`; `languages` is pipe-separated. Sunrise Nursing Home has 9 doctors across General Medicine (2), Obstetrics (2), Paediatrics (2), Orthopaedics, Dental and Ophthalmology, so every department the keyword table can return has a doctor. |
| `users.csv` | Sahay Desk logins for the demo hospital (receptionist, nurse, one per doctor), password `demo1234`. The hospital admin `desk<id>@sahay.demo` and `admin@sahay.demo` are created by the API itself. |
| `demo_appointments.csv`, `demo_calls.csv` | 29 fictional bookings (4 days back to tomorrow, all statuses) and 6 helpline calls, so the Desk is never empty. Dates are relative to the day the loader runs. |
| `department_keywords.csv` | `keyword,lang,department`: fixed visit-reason to department table in Tamil, Hindi and English, native script and romanized. A reason that matches no keyword defaults to **General Medicine** (not listed here). |

Slots are not a CSV: the loader generates them.

## Loading

```
docker compose up -d
python scripts/load_seed.py
```

The loader is idempotent. It updates facilities and doctors in place (matched by name, so the ids that desk users and appointments point at stay valid), adds any missing 15-minute slots (09:00-13:00 and 16:00-18:00 IST) for the next 7 days for doctors at partner facilities (the API also does this at start-up and every 6 hours), then creates the demo logins, appointments and calls **only if they do not exist**, so a redeploy during a demo never resets arrived/done/callback states or changed passwords. It also removes the old `doctor<id>@sahay.demo` logins and the desk logins of hospitals that are no longer partners.
