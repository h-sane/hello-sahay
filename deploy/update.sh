#!/usr/bin/env bash
# Runs every minute from cron on the server. Redeploys when the tracked branch has a new
# commit or the public IP changed; otherwise exits in about a second.
set -euo pipefail
exec 9>/opt/sahay/.lock; flock -n 9 || exit 0

BRANCH="${DEPLOY_BRANCH:-main}"
REPO=/opt/sahay/repo
STATE=/opt/sahay/state
cd "$REPO"

IP=$(curl -fsS --max-time 10 https://checkip.amazonaws.com | tr -d '[:space:]')
git fetch -q origin "$BRANCH"
NEW=$(git rev-parse "origin/$BRANCH")
TODAY=$(date +%F)
[ -f "$STATE" ] && . "$STATE" || { OLD=; OLDIP=; SEEDED=; INGESTED=; }

if [ "$NEW" = "${OLD:-}" ] && [ "$IP" = "${OLDIP:-}" ] && [ "$TODAY" = "${SEEDED:-}" ]; then exit 0; fi
echo "[$(date -Is)] deploy ${OLD:-none} -> $NEW ip=$IP"

git reset -q --hard "origin/$BRANCH"
DASHED=${IP//./-}
APP_HOST="$DASHED.sslip.io"
DESK_HOST="desk.$DASHED.sslip.io"
ADMIN_HOST="admin.$DASHED.sslip.io"
sed -i -e '/^APP_HOST=/d' -e '/^DESK_HOST=/d' -e '/^ADMIN_HOST=/d' -e '/^CORS_ORIGINS=/d' /opt/sahay/stack.env
cat >> /opt/sahay/stack.env <<ENV
APP_HOST=$APP_HOST
DESK_HOST=$DESK_HOST
ADMIN_HOST=$ADMIN_HOST
CORS_ORIGINS=https://$APP_HOST,https://$DESK_HOST,https://$ADMIN_HOST,https://localhost,http://localhost,capacitor://localhost
ENV

build_web() { # name dir
  local hash; hash=$(git rev-parse "HEAD:$2")
  if [ ! -f "/opt/sahay/web/$1/.built-$hash" ]; then
    docker run --rm -v "$REPO/$2:/w" -w /w node:22-slim sh -c "npm ci --no-audit --no-fund && npm run build"
    rm -rf "/opt/sahay/web/$1"; mkdir -p "/opt/sahay/web/$1"
    cp -r "$REPO/$2/dist/." "/opt/sahay/web/$1/"
    touch "/opt/sahay/web/$1/.built-$hash"
  fi
}
build_web patient apps/patient-web
build_web desk apps/desk
rm -rf /opt/sahay/web/admin; mkdir -p /opt/sahay/web/admin
cp "$REPO/apps/admin/index.html" /opt/sahay/web/admin/

cd deploy
docker compose up -d --build --remove-orphans
docker compose restart api voice bridge caddy >/dev/null

until docker compose exec -T api python -c "import urllib.request as u;u.urlopen('http://localhost:8001/api/v1/health')" 2>/dev/null; do sleep 2; done
docker compose exec -T api python scripts/load_seed.py
docker compose exec -T api python scripts/load_medicines.py load --if-empty
if [ -z "${INGESTED:-}" ]; then
  # about a second per chunk because the account throttles Titan; runs in the background
  docker compose exec -T -d api python scripts/ingest_advisories.py
  INGESTED=1
fi
printf 'OLD=%s\nOLDIP=%s\nSEEDED=%s\nINGESTED=%s\n' "$NEW" "$IP" "$TODAY" "$INGESTED" > "$STATE"
echo "[$(date -Is)] deploy done https://$APP_HOST https://$DESK_HOST https://$ADMIN_HOST"
