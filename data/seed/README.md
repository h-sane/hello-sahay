# data/seed - DEMO DATA

Everything here is **fictional demo data** (task card P1-2). Facility names, doctors and phone numbers are invented and must stay labelled as demo data. Each CSV starts with a `# DEMO DATA` comment line, which the loader skips.

Demo district: Chengalpattu (Tamil Nadu), around Chengalpattu, Madurantakam and Thirukazhukundram.

| File | Contents |
|---|---|
| `facilities.csv` | 10 facilities: 4 PHC, 1 CHC, 1 GH, 4 private. Exactly the 4 private ones are `is_partner=true` (plan `sahay_desk`); government facilities are never partners. Columns follow the `facility` table in `docs/ARCHITECTURE.md` section 4; `departments` is pipe-separated. |
| `doctors.csv` | 2-4 fictional doctors per facility, linked by `facility_name`; `languages` is pipe-separated. |
| `department_keywords.csv` | `keyword,lang,department`: fixed visit-reason to department table in Tamil, Hindi and English, native script and romanized. A reason that matches no keyword defaults to **General Medicine** (not listed here). |

Slots are not a CSV: the loader generates them.

## Loading

```
docker compose up -d
python scripts/load_seed.py
```

The loader is idempotent. It updates facilities and doctors in place (matched by name, so the ids that desk users and appointments point at stay valid), then regenerates open slots for the next 3 days (today + 2; 09:00-13:00 and 16:00-18:00 IST, 15-minute slots) for doctors at partner facilities only. Booked and blocked slots are kept.
