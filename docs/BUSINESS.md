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
| 1 | **Clinics, nursing homes and hospitals** (private, tier-2/3 towns) | Sahay Desk subscription: dashboard, booking calendar, reminders, helpline number forwarding | ₹999 / ₹2,499 / ₹4,999 a month by tier, see "Hospital tiers" below | 🟡 researched proposal, not yet confirmed by the team or by clinic calls |
| 2 | **Same hospitals** | Per patient who actually arrives from the helpline (marked on Desk check-in); funds the free helpline | ₹30 (clinic) or ₹50 (nursing home, hospital) per arrived patient | 🟡 researched proposal |
| 3 | **Family members** (urban or migrant children) | Care plan: medicine alarms, adherence tracking, missed-dose family alerts, unlimited composition checks | ₹149 / month | 🟡 working number (brief range was ₹99–199) |
| 4 | **States, CSR, 104 operators** | Sponsor helpline minutes, or license Hello Sahay as the AI layer for state 104 helplines | Not priced | ✅ direction, ❓ numbers |

**Patients do not pay** for the helpline, chat, advisories, appointment booking, confirmations or basic medicine checks (3 a day). ✅ We do not charge rural patients for advisories (free on government sites; would look exploitative) or for appointment checks (hospitals want patients to show up, so hospitals pay).

### Hospital tiers 🟡

Jury feedback (round 1) asked why hospitals would pay and how clinics differ from hospitals, so the price depends on the facility's size. Prices exclude GST, as the competitors quote them.

**How a facility is classified:** by the number of inpatient beds on its Clinical Establishments registration, a fact the hospital can show us.

| Tier | Who | Monthly | Per arrived patient | Helpline calls included a month |
|---|---|---|---|---|
| Clinic | No inpatient beds | ₹999 | ₹30 | 150 |
| Nursing home | 1 to 30 beds | ₹2,499 | ₹50 | 400 |
| Hospital | 31 or more beds | ₹4,999 | ₹50 | 1,000 |

Rules:

- The first clinics get two free months as a pilot; it produces real arrival counts and a real conversion rate for the next judging round.
- The arrival fee applies only to a patient who first reached the hospital through the helpline, not to the hospital's own repeat patients or counter walk-ins.
- Calls above the included number are not yet priced; decide once real call volumes exist. The allowance exists because forwarding a clinic's own number can cost more in calls than the subscription earns.
- The Hospital tier is listed so a larger hospital that asks has an answer. The first sales target is clinics and nursing homes, since 84% of private hospitals have fewer than 30 beds (older figure).

**Where the numbers come from:**

| Number | Evidence |
|---|---|
| Clinic ₹999 | Practo Ray ₹999 a month (1-year plan), Vitels Pro ₹999, Latrexa ₹499 to ₹4,999, DocPulse appointments ₹500 for up to 500 visits a month. A small-town clinic receptionist earns ₹10,000 to ₹18,000 a month (Tamil Nadu job ads, 2026), so ₹999 is under a tenth of that. |
| Nursing home ₹2,499, Hospital ₹4,999 | Halemind publishes ₹999, ₹2,499 and ₹4,999 tiers by doctor count; Practo Insta (hospital product) is ₹1,000 per user with a 5-user minimum; a full hospital management system starts near ₹3,00,000 a year, which we are not. |
| Arrival fee floor | Voice cost per arrived patient: about ₹23 (see "Measured cost per call"). |
| Arrival fee ceiling | About 10 to 15% of a consultation fee. Small-city consultation fees are ₹150 to ₹300 in directory listings (no survey found); DocPulse sells a 10% consultation-charge add-on. ₹30 is 10 to 15% of ₹200 to ₹300. |

Sources read on 2026-11-04: elaior.com/clinic-management-software-price-india, vitels.in/clinic-software-price-india, docpulse.com/solutions/clinic-management-software-demo, sarvam.ai/api-pricing, exotel.com/pricing/business-phone-system, evaniosjobs.com receptionist listings (Tenkasi, Tirunelveli, Tiruvallur), business-standard.com "In the pink of health" (2007), newindianexpress.com "Small players dominate pvt care sector" (2019).

**Not yet verified:** consultation fees come from listings, not a survey; no source found for patients a day at a small-town clinic or for Tamil Nadu clinic counts by bed size (the state portal tncea.dmrhs.tn.gov.in is the place to look); the bed-size split is old.

**Fee trigger:** the arrival fee is charged only when the hospital marks the patient arrived on Sahay Desk. **The demo does not show tiers yet:** the admin console and `services/api/app/routers/admin.py` still compute the earlier flat ₹2,999 a month and ₹40 per arrival for every partner. In the demo, marking a patient arrived adds a fee line in the admin payments screen.

**Payments in the demo:** the Care plan payment is a demo record (`DEMO-PAY-n`; Razorpay keys are not set up). Hospital subscription and arrival-fee lines are computed in the admin console from the partner flag and arrived appointments, so the model shows working without real money.

## 4. Pricing logic

- Avoid a one-time subscription; voice calls cost money every minute, so revenue has to recur. ✅
- Considered: per call, flat monthly, hybrid (monthly plan plus per-booking fee). The structure we chose, a monthly plan by facility size plus a per-arrival fee, follows the hybrid idea. 🟡
- The subscription stays because the dashboard is the base product (without it a hospital cannot see its appointments), the hospital itself marks arrivals so an arrival-only fee could be under-reported, and every call costs money whether or not it ends in a visit.
- **Anchors:**
  - Competing receptionists: ₹1,999–9,999 a month (Hellodesk, HuskyVoice from ₹1,999; Voxerra from ₹4,999).
  - Production voice AI cost: ₹3–9 per connected minute (Caller.digital).
  - Median outpatient no-show rate in India: 32% (vendor claim; cite with care).
  - Bharosa AI is testing a similar $1–2 per qualified lead.
- **Measured cost per call** 🟡 (2026-11-04): 26 traced calls on the hosted helpline averaged 76 seconds and 609 spoken characters. They were mostly our own test calls, so real callers may talk longer.

  | Item | Rate | Per average call |
  |---|---|---|
  | Telephony | about ₹0.90 a minute (Exotel outbound, from a secondary source; check the inbound rate in the Exotel dashboard) | ₹1.14 |
  | Speech-to-text | Sarvam ₹0.49 a minute | ₹0.62 |
  | Text-to-speech | Sarvam Bulbul v3 ₹3 per 1,000 characters | ₹1.83 |
  | Language model | allowance, Amazon Nova not priced | ₹0.50 |
  | **Total** | | **about ₹4** (the longest call, 233 seconds and 2,152 characters, about ₹12) |

  One booking confirmation and reminder by WhatsApp adds about ₹0.35.

  The earlier "₹3–9 per minute" figure was a vendor's all-in platform price; our own pipeline is cheaper.
- **Cost per arrived patient** 🟡: if one call in four ends in a booking and 70% of those patients arrive, about ₹23; at double the cost, about ₹46. Bulbul V4 Flash lists at ₹2 per 1,000 characters (₹1 until 12 November 2026), a third less than V3 at ₹3.
- **Clinic check** (an estimate, not a measurement): 100 calls a month give about 23 bookings and 16 arrivals, so revenue is ₹999 + 16 × ₹30 ≈ ₹1,479 against voice cost of about ₹400 (₹800 at double cost). That leaves ₹680 (₹280) before hosting and the phone number; the Exotel rental is roughly ₹950 a month, shared across all hospitals.

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

1. Confirm the tier prices (₹999 / ₹2,499 / ₹4,999, arrival fee ₹30 / ₹50) and the Care plan (₹149) with the team and with the clinic calls. Ask each clinic: consultation fee, patients a day, receptionist salary, missed calls a day, and whether it would pay ₹999.
2. Unit economics: repeat the cost-per-call measurement on real caller traffic, and confirm the Exotel inbound rate.
3. Price of helpline calls above each tier's included number.
4. Government hospitals are an information-only layer (OPD timings, departments), not a paying segment; confirm with the team (jury round 1 said they will not adopt appointments).
3. Final product name (Hello Sahay is working).
4. Pricing for the state / CSR / 104 licensing stream.
5. Who on the team owns the business role and the clinic calls.

Market-size figures in the one-page proposal (₹600 Cr TAM, 6 crore MSMEs, receptionist ₹12–15k/month) are estimates, not verified sources; do not quote them as fact.
