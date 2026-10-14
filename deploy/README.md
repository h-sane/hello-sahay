# deploy — hosting and the Android app

One Lightsail instance (ap-south-1, paid from AWS credits) runs everything: Postgres+pgvector,
API, voice service, phone bridge, and Caddy, which serves the built Sahay Desk and patient app
over HTTPS on `<ip>.sslip.io` names. A cron job on the box checks `origin/main` every minute and
redeploys on a new commit (and re-seeds slots daily), so **pushing to `main` is the whole deploy**.

| URL | What |
|---|---|
| `https://<ip-dashed>.sslip.io` | patient app (`apps/patient-web`), also `/api`, `/voice`, `/exotel` |
| `https://desk.<ip-dashed>.sslip.io` | Sahay Desk (`apps/desk`), also `/api` |

## One-time setup

1. AWS console → IAM → Users → `opencode-bedrock` → Add permissions → attach `AmazonLightsailFullAccess`.
2. From the repo root: `bash deploy/create-instance.sh` (reads `.env` and the `personal-bedrock` AWS
   profile, creates the box and a static IP, prints the two URLs). First deploy takes about 10 minutes.
3. Log: `/var/log/sahay-deploy.log` on the box (Lightsail console → Connect using SSH).

## Updating

`git push origin development:main` after a verified checkpoint; the box picks it up within a minute
(frontends are rebuilt only when their folder changed).

## Android app

`apps/patient-web/android` is a Capacitor wrapper around the patient web app, built with Gradle
like the Nirmaan apps (`~/.gradle/gradle.properties` holds the release keystore settings
`HELLOSAHAY_*`; keystore at `~/.android/hello-sahay.jks`, back it up).

```powershell
cd apps/patient-web
$env:VITE_API_URL='https://<host>/api/v1'; $env:VITE_VOICE_URL='https://<host>/voice'
npx vite build; npx cap sync android
cd android; .\gradlew.bat assembleRelease -PreactNativeArchitectures=arm64-v8a
# apk: android\app\build\outputs\apk\release\app-release.apk
```

Install with `adb install -r app-release.apk`. After changing web code, rebuild and re-sync; after
changing the host, rebuild with the new `VITE_*` values (they are baked in).
