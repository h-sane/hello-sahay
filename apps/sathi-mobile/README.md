# Sahay Sathi (helper app)

The phone app for home care helpers (personal caretaker, house cleaning, technical support, care support). A patient books a helper in the patient app's Services tab; the request lands here.

```
npm install
npm run dev        # http://localhost:3001, /api proxied to SAHAY_API_ORIGIN (default http://localhost:8001)
npm run lint       # tsc --noEmit
npm run build      # dist/, then `npx cap sync android` for the APK (appId in.hellosahay.sathi)
```

Try it: run `python scripts/load_seed.py`, then sign in with 98765 43210. The code is shown on screen in demo mode, or use the password `demo1234`. Every seeded helper (`+919000000101` onward, see `data/seed/service_helpers.csv`) uses the same password.

Release APK (signed with the same key as the patient app, settings in `~/.gradle/gradle.properties`), in PowerShell:

```
$env:VITE_API_URL='https://<host>/api/v1'; npx vite build; npx cap sync android
cd android; .\gradlew.bat assembleRelease -PreactNativeArchitectures=arm64-v8a
# androidppuild\outputspkeleasepp-release.apk
```

- API: `services/api/app/routers/sathi.py` (this app) and `routers/services.py` (the patient side). Endpoint list: `docs/FRONTEND_INTEGRATION.md`.
- The app never shows made-up data. If the server cannot be reached it shows the error; the saved login is cleared when the server says it is no longer valid.
- Requests refresh every 30 seconds while the app is open. There is no push notification yet.
- A newly registered helper is "pending" and cannot be booked until their `id_status` is set to `verified`. There is no screen for that yet.
- The ID document picker is optional; nothing is uploaded or stored.
