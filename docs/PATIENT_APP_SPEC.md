# Sahay Patient App — Requirements

Everything the patient app needs, in one list. Architecture and API: [`ARCHITECTURE.md`](ARCHITECTURE.md). Screens for the designer: [`FRONTEND_DELIVERABLES.md`](FRONTEND_DELIVERABLES.md).

> **Status 2026-10-15:** built as a Vite web app wrapped for Android with Capacitor (`apps/patient-web`), not Expo. Per-feature status is in [`PRODUCT_FEATURES.md`](PRODUCT_FEATURES.md). Where this spec differs from the app: sign-in uses a random 6-digit code shown on screen (not a fixed `123456`); the 3-checks-a-day limit and the government services hub are not built; reminders raise in-app alerts, with no loud alarm or WhatsApp; the Care plan payment is a demo; strings live in `apps/patient-web/src/translations`.

## 1. Who it is for
- Rural patients and elderly users on **low-end Android phones**, often first-time smartphone users, many who read little or no English.
- Their **children in cities**, who pay for the Care plan and watch over their parents' medicines.

## 2. Design rules (non-negotiable)
- **Languages:** Tamil, Hindi, English at launch; every string in translation files (`apps/patient-web/src/translations`), none hard-coded. Language picked on first launch, changeable from every screen's header.
- **Voice everywhere:** a microphone button on every input and a speaker button on every answer (read aloud).
- **Big and simple:** body text ≥ 18sp, buttons ≥ 56dp tall, high contrast, icons with text labels, at most 4 options per screen, no hidden gestures.
- **Works on poor networks:** loading states on everything, retry on failure, last results cached for offline viewing.
- **Every fact is cited:** health answers, compositions and prices always show their source and date.
- **Safety lines always visible:** "This app does not diagnose. In an emergency call 108." in the footer of chat and medicine screens; a red **Call 108** button on the home screen.

## 3. Features

### 3.1 Onboarding and account (free)
| Element | Detail |
|---|---|
| Language picker | 3 large buttons with the language name in its own script |
| Consent screen | Plain-language DPDP consent: what we store (name, phone, appointments, chats) and what we don't (no recordings); accept to continue |
| Phone login | Phone number + a random 6-digit code (valid 5 minutes, 5 tries); shown on screen in demo mode because India SMS needs DLT registration |
| Profile | Name, village, age (optional), family member's phone (optional) |

### 3.2 Home (free)
Four big tiles + emergency bar:
1. **Ask Sahay** (chat)
2. **My Medicines** (composition checker, prices, reminders)
3. **Appointments**
4. **Call Sahay** (voice helpline in the app)
- Red **Call 108** bar fixed at the bottom.
- Latest government advisory card (one line + source).

### 3.3 Ask Sahay — chatbot with RAG (free)
| Element | Detail |
|---|---|
| Chat input | Text + mic; replies in the user's language |
| Answers | Retrieved from government advisories only, with a **source chip** (issuer, title, date, link) under each answer |
| No-source fallback | "I don't have verified information on that. Please ask at your nearest PHC or call 104." |
| Symptom questions | Fixed safe reply + "Book a doctor" button + 108 if urgent words |
| Emergency words | Chat stops, full-screen **Call 108** prompt |
| Scope | Health advisories, government schemes (PM-JAY / CMCHIS eligibility, how to use the card), finding hospitals, app help |
| Quick questions | Suggested chips: "Dengue precautions", "Which hospital takes my CMCHIS card?", "Vaccination schedule for my baby" |

### 3.4 Medicine composition checker (free, limited)
| Element | Detail |
|---|---|
| Input | Scan the printed back of the strip (camera, OCR) **or** type / speak the brand name |
| Result | Brand, salts, strength, form — with the data source |
| Equivalents | Medicines with the **exact same** salts, strength and form, cheapest first; Jan Aushadhi generic flagged with its MRP |
| Never shown | Different molecules, different strengths, Ayurvedic or "similar" substitutes |
| Warning | "Confirm with your doctor or pharmacist before switching." on every result |
| Nearest Jan Aushadhi Kendra | Distance + directions |
| Free limit | **3 checks per day free**; more needs the Care plan |
| OCR rule | Printed strips only, never handwritten prescriptions |

### 3.5 Price comparison (free)
| Element | Detail |
|---|---|
| Price list | For the identified medicine and its exact equivalents: MRP per pack and per tablet |
| Savings line | "Jan Aushadhi version saves ₹X per month" (based on a dose count the user enters) |
| Sources | Every price shows its source and date (Jan Aushadhi list, NPPA ceiling, dataset); no live scraping of pharmacy sites |

### 3.6 Appointments (free)
- List of upcoming and past appointments (from helpline, app or hospital desk).
- Book: choose department → nearby hospitals (government first, scheme flags) → slot → confirm.
- Reschedule, cancel, directions, call the hospital.
- WhatsApp confirmation and a reminder the day before.

### 3.7 Call Sahay (free)
- One big button that opens the same voice pipeline as the helpline, inside the app.
- Shows a live transcript, the language, and an "end call" button.

### 3.8 Care plan — premium (paid, ₹149/month, usually paid by a family member)
| Feature | Detail |
|---|---|
| Medicine alarms | Loud alarm + spoken reminder in the user's language at each dose time |
| Adherence tracking | "Taken / Snooze / Skip" on each alarm; weekly calendar of taken vs missed |
| Family alerts | Missed dose → WhatsApp to the family member |
| Unlimited composition checks | Removes the 3-a-day limit |
| Paywall | Clear screen of what is free and what is paid; Razorpay test-mode checkout; "a family member can pay for you" share link |

> **Business note:** the proposal says patients never pay. That still holds: the Care plan is aimed at **family members paying for their parents**, and everything needed to get care (helpline, chat, appointments, basic medicine checks) stays free.

### 3.9 Government services hub (free, Phase 2)
Links with short explanations: PM-JAY card check, CMCHIS, eSanjeevani, Jan Aushadhi Kendra locator, 104 / 108.

## 4. Free vs paid at a glance

| Feature | Free | Care plan |
|---|---|---|
| Call Sahay, Ask Sahay chat, advisories | ✅ | ✅ |
| Appointments + WhatsApp confirmations | ✅ | ✅ |
| Composition checker | 3 per day | Unlimited |
| Price comparison | ✅ | ✅ |
| Medicine alarms | — | ✅ |
| Adherence tracking + family alerts | — | ✅ |

## 5. Every screen's states
Each screen must be designed for: **loading**, **empty** (no appointments yet, no results), **error** (no network, server down, OCR failed: "Couldn't read the strip, type the name instead"), **success**, and **limit reached** (paywall) where relevant.

## 6. Out of scope for the hackathon
Handwritten prescription reading, teleconsultation, online medicine ordering, iOS build, real SMS (needs DLT registration).
