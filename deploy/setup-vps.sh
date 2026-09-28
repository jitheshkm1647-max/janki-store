#!/usr/bin/env bash
# First-time install (and later updates) of the Janki Design store on an
# Ubuntu/Debian VPS. Run as root from the repository folder:
#
#   bash deploy/setup-vps.sh jankidesign.com you@example.com
#
# Safe to run again: it keeps existing secrets and data, pulls in code changes,
# rebuilds and restarts.

set -euo pipefail

DOMAIN="${1:-jankidesign.com}"
ACME_EMAIL="${2:-admin@${DOMAIN}}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@${DOMAIN}}"

cd "$(dirname "$0")/.."
ENV_FILE="deploy/.env.production"
COMPOSE=(docker compose -f docker-compose.prod.yml --env-file "$ENV_FILE")

say() { printf "\n\033[1;35m==> %s\033[0m\n" "$1"; }

say "Checking Docker"
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
fi
systemctl enable --now docker >/dev/null 2>&1 || true

if command -v ufw >/dev/null 2>&1 && ufw status | grep -q "Status: active"; then
  say "Opening firewall ports 80 and 443"
  ufw allow 80/tcp && ufw allow 443/tcp && ufw allow 443/udp
fi

# A small swap file keeps builds from running out of memory on 4 GB servers.
if ! swapon --show | grep -q .; then
  say "Adding 4 GB swap"
  fallocate -l 4G /swapfile && chmod 600 /swapfile && mkswap /swapfile >/dev/null && swapon /swapfile
  grep -q "/swapfile" /etc/fstab || echo "/swapfile none swap sw 0 0" >> /etc/fstab
fi

if [ ! -f "$ENV_FILE" ]; then
  say "Creating $ENV_FILE with new secrets"
  cat > "$ENV_FILE" <<EOF
DOMAIN=${DOMAIN}
ACME_EMAIL=${ACME_EMAIL}
POSTGRES_PASSWORD=$(openssl rand -hex 24)
JWT_SECRET=$(openssl rand -hex 32)
COOKIE_SECRET=$(openssl rand -hex 32)
MEDUSA_PUBLISHABLE_KEY=
CASHFREE_CLIENT_ID=
CASHFREE_CLIENT_SECRET=
CASHFREE_ENVIRONMENT=sandbox
EOF
  chmod 600 "$ENV_FILE"
fi

say "Building and starting database, Redis and backend (first build takes 5-10 minutes)"
"${COMPOSE[@]}" up -d --build postgres redis backend

say "Waiting for the backend to be healthy"
for i in $(seq 1 90); do
  status=$(docker inspect -f '{{.State.Health.Status}}' "$("${COMPOSE[@]}" ps -q backend)" 2>/dev/null || echo starting)
  [ "$status" = "healthy" ] && break
  sleep 5
done
[ "$status" = "healthy" ] || { echo "Backend did not become healthy. Logs:"; "${COMPOSE[@]}" logs --tail 80 backend; exit 1; }

KEY=$("${COMPOSE[@]}" exec -T postgres psql -U janki -d janki -tAc \
  "select token from api_key where type='publishable' and revoked_at is null order by created_at limit 1" | tr -d '[:space:]')
[ -n "$KEY" ] || { echo "No publishable key found in the database."; exit 1; }
sed -i "s/^MEDUSA_PUBLISHABLE_KEY=.*/MEDUSA_PUBLISHABLE_KEY=${KEY}/" "$ENV_FILE"

say "Building and starting the storefront and HTTPS proxy"
# A fresh storefront container builds the site from the latest code and catalogue
"${COMPOSE[@]}" up -d --build --force-recreate storefront
"${COMPOSE[@]}" up -d caddy

if [ ! -f deploy/.admin-created ]; then
  say "Creating the admin login"
  ADMIN_PASSWORD="$(openssl rand -base64 12 | tr -d '/+=')Jd1"
  if "${COMPOSE[@]}" exec -T backend npx medusa user -e "$ADMIN_EMAIL" -p "$ADMIN_PASSWORD"; then
    touch deploy/.admin-created
    printf "\n\033[1;33mAdmin login: %s  /  %s\nSave this password now; it is not stored anywhere.\033[0m\n" "$ADMIN_EMAIL" "$ADMIN_PASSWORD"
  fi
fi

say "Done"
echo "Shop:  https://${DOMAIN}   (the storefront builds for a few minutes on first start)"
echo "Admin: https://api.${DOMAIN}/app"
echo "Logs:  ${COMPOSE[*]} logs -f storefront backend"
