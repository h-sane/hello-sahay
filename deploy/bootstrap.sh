#!/usr/bin/env bash
# First boot of a fresh Ubuntu Lightsail instance. Expects these in the environment
# (the instance launch script exports them): AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY,
# SARVAM_API_KEY, DEMO_EMERGENCY_NUMBER. Optional: DEPLOY_BRANCH (default main).
set -euxo pipefail
BRANCH="${DEPLOY_BRANCH:-main}"

fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab

apt-get update -y
apt-get install -y git curl cron util-linux
curl -fsSL https://get.docker.com | sh

mkdir -p /opt/sahay/aws /opt/sahay/web
git clone -b "$BRANCH" https://github.com/h-sane/hello-sahay.git /opt/sahay/repo

cat > /opt/sahay/aws/credentials <<CRED
[personal-bedrock]
aws_access_key_id = $AWS_ACCESS_KEY_ID
aws_secret_access_key = $AWS_SECRET_ACCESS_KEY
CRED
printf '[profile personal-bedrock]\nregion = ap-south-1\n' > /opt/sahay/aws/config

umask 077
cat > /opt/sahay/stack.env <<ENV
JWT_SECRET=$(head -c 32 /dev/urandom | base64 | tr -d '/+=\n')
DEMO_OTP=123456
SARVAM_API_KEY=${SARVAM_API_KEY:-}
DEMO_EMERGENCY_NUMBER=${DEMO_EMERGENCY_NUMBER:-}
BEDROCK_FAST_MODEL_ID=apac.amazon.nova-lite-v1:0
BEDROCK_SMART_MODEL_ID=apac.amazon.nova-pro-v1:0
BEDROCK_EMBED_MODEL_ID=amazon.titan-embed-text-v2:0
ENV
echo "DEPLOY_BRANCH=$BRANCH" > /etc/default/sahay

echo '* * * * * root . /etc/default/sahay; export DEPLOY_BRANCH; /bin/bash /opt/sahay/repo/deploy/update.sh >> /var/log/sahay-deploy.log 2>&1' > /etc/cron.d/sahay
chmod 644 /etc/cron.d/sahay
DEPLOY_BRANCH=$BRANCH bash /opt/sahay/repo/deploy/update.sh >> /var/log/sahay-deploy.log 2>&1 &
