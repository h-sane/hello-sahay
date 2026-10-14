#!/usr/bin/env bash
# One-time, run by Hussain from the repo root (it copies the personal-bedrock AWS key into the
# instance launch script, so it is not run by an agent). Needs the personal-bedrock IAM user to
# have an inline policy allowing lightsail:*. Prints only the final URLs.
#   DRY_RUN=1 bash deploy/create-instance.sh   # builds the launch script and syntax-checks it
set -euo pipefail
export AWS_PROFILE=personal-bedrock AWS_DEFAULT_REGION=ap-south-1
NAME=${NAME:-sahay}
BUNDLE=${BUNDLE:-small_3_0}   # 2 GB RAM, 2 vCPU
BRANCH=${DEPLOY_BRANCH:-main}

envval() { grep -E "^$1=" .env 2>/dev/null | head -1 | cut -d= -f2- | tr -d "\"'\r" || true; }

LAUNCH=$(mktemp)
trap 'rm -f "$LAUNCH"' EXIT
cat > "$LAUNCH" <<SCRIPT
#!/bin/bash
export AWS_ACCESS_KEY_ID='$(aws configure get aws_access_key_id)'
export AWS_SECRET_ACCESS_KEY='$(aws configure get aws_secret_access_key)'
export SARVAM_API_KEY='$(envval SARVAM_API_KEY)'
export DEMO_EMERGENCY_NUMBER='$(envval DEMO_EMERGENCY_NUMBER)'
export DEPLOY_BRANCH='$BRANCH'
curl -fsSL https://raw.githubusercontent.com/h-sane/hello-sahay/$BRANCH/deploy/bootstrap.sh | bash
SCRIPT
bash -n "$LAUNCH"
if [ -n "${DRY_RUN:-}" ]; then echo "launch script ok ($(wc -c < "$LAUNCH") bytes)"; exit 0; fi

aws lightsail create-instances --instance-names "$NAME" --availability-zone ap-south-1a \
  --blueprint-id ubuntu_24_04 --bundle-id "$BUNDLE" --user-data "$(cat "$LAUNCH")" >/dev/null
aws lightsail allocate-static-ip --static-ip-name "$NAME-ip" >/dev/null
until aws lightsail get-instance-state --instance-name "$NAME" --query state.name --output text | grep -q running; do sleep 5; done
aws lightsail attach-static-ip --static-ip-name "$NAME-ip" --instance-name "$NAME" >/dev/null
aws lightsail open-instance-public-ports --instance-name "$NAME" --port-info fromPort=443,toPort=443,protocol=TCP >/dev/null
IP=$(aws lightsail get-static-ip --static-ip-name "$NAME-ip" --query staticIp.ipAddress --output text)
D=${IP//./-}
echo "Instance up at $IP. First deploy takes about 10 minutes (Docker install, builds, advisory ingest)."
echo "  Patient app: https://$D.sslip.io"
echo "  Sahay Desk:  https://desk.$D.sslip.io"
