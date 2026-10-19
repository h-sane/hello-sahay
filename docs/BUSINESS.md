# Hello Sahay — Business Decisions

Everything decided so far on the business side, in one place. Product detail: [`PRODUCT_FEATURES.md`](PRODUCT_FEATURES.md). Full context and sources: [`PROJECT_BRIEF.md`](PROJECT_BRIEF.md) §5, §6, §9.

**Status legend:** ✅ decided · 🟡 working number or proposal, not yet confirmed by the team · ❓ open.

## 1. The business in one paragraph

Patients never pay for care. A free multilingual voice helpline sends patients to hospitals; small private hospitals pay for the dashboard that receives those patients and for each patient who actually arrives. Families in cities can pay a small monthly fee for medicine reminders for their rural parents.

## 2. Positioning ✅

> "Other AI receptionists answer a hospital's phone. Hello Sahay answers the patient's question: where to go, what's covered and when to show up. Then it books it."

- **Patient-first, across many hospitals.** Competing receptionists serve one hospital's number; ours is the patient's number for any hospital.
- **Government and private in one call**, government options first, with PM-JAY / CMCHIS cashless flags and the nearest Jan Aushadhi Kendra.
- **Voice-first for feature phones.** Patient-side competitors are app-first.
- **Hospitals get new patients, not only answered calls.** That is what justifies pricing above the ₹1,999 market floor.
- **Network effect:** more hospitals make the helpline more useful, more callers make Sahay Desk worth more.
- The AI receptionist alone is **not** the USP; that market is crowded.

## 3. Who pays and who does not

| # | Payer | What they pay for | Amount | Status |
|---|---|---|---|---|
| 1 | **Hospitals and clinics** (small and mid private hospitals, nursing homes in tier-2/3 towns) | Sahay Desk subscription | ₹2,999 / month | 🟡 working number used in the proposal |
| 2 | **Hospitals** | Per patient who actually arrives from the helpline (marked on Desk check-in); funds the free helpline | ₹40 per arrived patient | 🟡 working number |
| 3 | **Family members** (urban or migrant children) | Care plan: medicine alarms, adherence tracking, missed-dose family alerts, unlimited composition checks | ₹149 / month | 🟡 working number (brief range was ₹99–199) |
| 4 | **States, CSR, 104 operators** | Sponsor helpline minutes, or license Hello Sahay as the AI layer for state 104 helplines | Not priced | ✅ direction, ❓ numbers |

**Patients do not pay** for the helpline, chat, advisories, appointment booking, confirmations or basic medicine checks (3 a day). ✅ We do not charge rural patients for advisories (free on government sites; would look exploitative) or for appointment checks (hospitals want patients to show up, so hospitals pay).

**Fee trigger:** the ₹40 fee is charged only when the hospital marks the patient arrived on Sahay Desk. In the demo, marking a patient arrived adds a ₹40 line in the admin payments screen.

**Payments in the demo:** the Care plan payment is a demo record (`DEMO-PAY-n`; Razorpay keys are not set up). Hospital subscription and arrival-fee lines are computed in the admin console from the partner flag and arrived appointments, so the model shows working without real money.

## 4. Pricing logic

- Avoid a one-time subscription; voice calls cost money every minute, so revenue has to recur. ✅
- Considered: per call, flat monthly, hybrid (monthly plan plus per-booking fee). The structure we chose, a flat monthly plan plus a per-arrival fee, follows the hybrid idea. 🟡
- **Anchors:**
  - Competing receptionists: ₹1,999–9,999 a month (Hellodesk, HuskyVoice from ₹1,999; Voxerra from ₹4,999).
  - Production voice AI cost: ₹3–9 per connected minute (Caller.digital).
  - Median outpatient no-show rate in India: 32% (vendor claim; cite with care).
  - Bharosa AI is testing a similar $1–2 per qualified lead.
- **Unit economics still to compute before the pitch** ❓: cost per call (speech-to-text + LLM + text-to-speech + telephony) × average call length against revenue per booking. As an illustration only, a 3-minute call at ₹3–9 a minute costs ₹9–27 in voice AI alone, so one ₹40 arrival fee covers the call that produced it; the call length is an assumption, not a measurement.

## 5. Go-to-market ✅

1. **Wedge:** forward each partner hospital's existing phone number to Sahay. The hospital gets value on day one from its own callers, which solves the chicken-and-egg problem.
2. Then aggregate those hospitals behind the shared Hello Sahay helpline number.
3. **Channels:**
   - Local doctors' and nursing-home associations in tier-2/3 Tamil Nadu towns.
   - Rural partners: iKure (7,900+ villages, 11 states) and Karma Primary Healthcare.
   - FPOs, SHGs and panchayats for helpline awareness.
   - State health missions and 104 operators for business-to-government.
4. **Business member's task during the hackathon:** call 2–3 local clinics for real quotes on receptionist salary, missed calls and willingness to pay. Real interviews are the strongest pitch evidence.

## 6. Judging context (Dexathon 2026)

- The idea deck, the prototype and the business plan are all judged.
- Quality beyond the core counts: security, privacy, affordability, accessibility.
- Ready-made agent platforms (Vapi, Bolna) as the core earn less credit, so the voice pipeline is built by us.

## 7. Competitive position

| Group | Examples | Why we differ |
|---|---|---|
| Hospital-side AI receptionists | Hellodesk, HuskyVoice, Voxerra, Tatkal Doctor, Caller.digital, Bharosa AI, Ringg (powers Practo), Sarvam templates | All single-hospital and urban-leaning; none rural or patient-first |
| Patient-side and government | Practo, eSanjeevani, 104 (EMRI), Kilkari, Jugalbandi, Ayushman app | Private-only, app-only, advice-only or no booking; none combine voice, booking and scheme coverage |
| Medicine and generics | Truemeds, Tata 1mg, Janaushadhi Sugam | Commodity; our only addition is voice access for feature-phone users and routing to the nearest Kendra, so it is not our USP |
| Caregiver | Anvayaa, Samarth | Human care managers, premium, metro; a low-cost tech-only plan for rural parents is open space |

**Lesson from EMMA (UK):** a Norfolk practice dropped the AI receptionist in September 2026 after complaints from patients with regional accents and speech difficulties. Our answer: dialect and code-mixing tolerance, a keypad fallback and an always-available human handoff.

## 8. Answers to likely jury challenges ✅

| Challenge | Answer |
|---|---|
| "Isn't this just Hellodesk?" | They serve one clinic. We are the patient's network across government and private facilities, with schemes, and we send hospitals new patients. |
| "Practo and Ringg could go rural." | Their model is private-hospital commission. Rural demand needs a government and scheme layer they will not build. |
| "Government will add AI to 104 or eSanjeevani." | We license to them as the AI layer. |
| "Why not just use Sarvam?" | Sarvam is a toolkit; we are the product and the network. |
| "Voice AI fails on accents." | EMMA proves the risk; we have a keypad fallback, human handoff and dialect-tolerant handling. |
| "Are you funnelling poor patients to private hospitals?" | No. Free government options come first and PM-JAY / CMCHIS cashless hospitals are flagged. |

## 9. Trust and compliance as business assets ✅

- No AI diagnosis or treatment advice; answers quoted from government sources with the source named.
- DPDP: consent at call start, transcripts only (no audio by default), minimal data, encryption, AWS Mumbai where models allow.
- Seed data labelled DEMO DATA; no real patient data in the repo.
- Medicine feature: same composition, strength and form only, always "confirm with your doctor or pharmacist".

## 10. Open business questions ❓

1. Confirm the three working prices (₹2,999 / ₹40 / ₹149) with the team and with the clinic calls.
2. Unit economics: measured cost per call and average call length.
3. Final product name (Hello Sahay is working).
4. Pricing for the state / CSR / 104 licensing stream.
5. Who on the team owns the business role and the clinic calls.

Market-size figures in the one-page proposal (₹600 Cr TAM, 6 crore MSMEs, receptionist ₹12–15k/month) are estimates, not verified sources; do not quote them as fact.
