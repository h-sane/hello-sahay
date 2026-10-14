# Patient app fix plan, tab by tab

Source: Hussain's critique list of 2026-10-15. One session per tab. Each tab ends
with a handoff, a commit, and a check on a phone-width screen (360 x 740).

Rules for every tab: short plain text, large type, one action per card, no wall
of copy. Real data where it exists; where it does not, labelled demo data.
Nothing that looks like it works but does nothing.

## Order

| # | Tab | Covers critique items |
|---|---|---|
| 0 | First open: language, profile, phone, code | profile required, phone required, 6-digit code not received |
| 1 | Home | start call = AI helpline, emergency = Adithya's number, too much text, mobile layout |
| 2 | Hospitals (and booking) | "online booking not available", real data, scheme tags |
| 3 | Ask Sahay | readability, mobile layout, real answers only |
| 4 | Medicines | real data, real scan, legit AI workflow |
| 5 | My Health | my appointments, family, care plan, parent switches to "monitored" |

Tab 0 comes first because every other tab needs a verified phone number.

## What is wrong today (found in the code)

**Tab 0.** The first screen only picks a language. There is no name, age, village or
phone. The sign-in code is the same fixed `123456` for everyone and the app never
says so, so nobody "receives" anything. The code is only asked for deep inside My Health.

**Tab 1.** "Call" on a hospital dials `DEMO_CALL_NUMBER`, falling back to the demo
emergency number. The Emergency screen shows a made-up family contact
(`9840199999`) and a fixed fake GPS line ("Maduranthakam"). The browser "Call Sahay"
page works, but the plain phone button should reach the AI helpline.

**Tab 2.** Facilities that are not partners show "Online booking is not available".
Every OpenStreetMap hospital is tagged PM-JAY and CMCHIS, which is an invented
claim. Departments are empty for OSM hospitals.

**Tab 3.** Answers come from `POST /chat` (cited, safety gate first), which is good.
Text-heavy cards and the "recommended hospital" block need the same cleanup.

**Tab 4.** Ten medicines are typed into the app. The camera scanner is a timer plus
keyword matching, and when nothing matches it returns Calpol. The database tables
(`medicine`, `jan_aushadhi_product`) are empty and no API serves them.

**Tab 5.** Appointments are a local cache refreshed by phone. Family members are
stored only on the phone, with no number. There is no care plan, no payment and no
"monitored" state anywhere in the app or API.

## Tab 0: First open

Build:
1. Step order: language, then "About you" (name, age, gender, village, mobile number,
   all required), then a 6-digit code, then location.
2. API: a random code per request, expires in 5 minutes, 5 tries, saved profile
   (`PUT /patients/me`), returning users get their details back on a new device.
3. Delivery: no SMS route exists for India without DLT registration. The code is
   shown on the screen in demo mode ("Demo code: 482913") and sent over WhatsApp
   when the WhatsApp number is configured. The screen says which one happened.

Done when: a new phone number gets through all steps on a 360 px screen, a wrong
code is refused, and the profile is on the server.

## Tab 1: Home

Build:
1. One config call (`GET /config/contacts`) gives the app two numbers: the AI
   helpline (Exotel 044-481-36970) and the emergency desk (`DEMO_EMERGENCY_NUMBER`,
   Adithya). No number is typed into the app.
2. "Start call" = browser call to the AI, with a plain "Call by phone" link to the
   helpline number. Emergency button = Adithya's number first, 108 and 112 as small
   secondary links.
3. Replace the fake family contact and fake GPS with the patient's own details.
4. Cut the page to: greeting, Start call, Emergency, nearest hospital, three
   shortcuts.

## Tab 2: Hospitals and booking

**Status: done 2026-10-15** (see handoff session_19). Real scheme tags from the CMCHIS list, real Leaflet/OpenStreetMap map, phone-width cards, Call buttons show no number.

Build:
1. Every hospital in the list can be booked (it goes to the one demo hospital, the
   patient's appointment still shows the hospital they chose). The "not available"
   box goes away; if slots fail to load it says "No free slots, try another day".
2. Scheme tags: try the public PM-JAY empanelled list and the CMCHIS list first. A
   tag shows only for a hospital found in a list; otherwise "Ask the hospital"
   and no tag. Demo hospitals keep their seeded tags, marked DEMO.
3. Filters and cards simplified for phone width.

## Tab 3: Ask Sahay

Build: shorter reply cards, source line always visible, big mic and send buttons,
check every state on a phone (loading, error, emergency, no answer).

## Tab 4: Medicines

Build:
1. Load a real brand-to-composition dataset (Indian Medicine Dataset, about 250k
   rows) and the Jan Aushadhi price list into the existing tables.
2. `GET /medicines/search?q=` and `POST /medicines/scan`.
3. Scan workflow: the photo goes to Amazon Nova (vision) which only reads the
   printed name and composition off the strip. A fixed program then matches the
   composition, strength and form against the Jan Aushadhi list and shows the
   saving. The AI never chooses the substitute. Always "confirm with your doctor
   or pharmacist". If nothing matches, it says so (no default medicine).

## Tab 5: My Health

Build:
1. My appointments: loaded from the server by the signed-in number, cancel and
   reschedule, status in words.
2. Family: a member has a name and a mobile number.
3. Care plan: the child adds a parent's number and pays (test payment, labelled).
   The server marks the parent "monitored by" the child. When the parent opens the
   app (or already has it open), the app switches to the monitored view with the
   child's name and what the child can see.

Done when: the child pays, the parent's app changes without the parent doing
anything except opening it.

## Decisions taken as defaults (say if you disagree)

1. Sign-in code is shown on screen in demo mode because there is no SMS route.
2. In the Emergency screen Adithya's number is the main button; 108 and 112 stay
   as small links because the safety rules say a patient must always be told them.
3. Payments stay a test stub until Razorpay keys exist.
