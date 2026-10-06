#!/usr/bin/env bash
# First-time install (and later updates) of the Janki Design store on an
# Ubuntu/Debian VPS. Run as root from the repository folder:
#
#   bash deploy/setup-vps.sh jankidesign.com you@example.com
#
# Safe to run again: it keeps existing secrets and data, rebuilds and restarts.
#
# HTTPS:
#  - If nginx already serves ports 80/443 (for example FASTPANEL), the store is
#    added to that nginx as its own site with a Let's Encrypt certificate from
#    certbot. Other sites on the server are not touched.
#  - Otherwise the bundled Caddy container serves 80/443 and handles HTTPS.

set -euo pipefail

DOMAIN="${1:-jankidesign.com}"
ACME_EMAIL="${2:-admin@${DOMAIN}}"
ADMIN_EMAIL="${ADMIN_EMAIL:-admin@${DOMAIN}}"
STOREFRONT_PORT="${STOREFRONT_PORT:-3910}"
BACKEND_PORT="${BACKEND_PORT:-9910}"

cd "$(dirname "$0")/.."
ENV_FILE="deploy/.env.production"

say() { printf "\n\033[1;35m==> %s\033[0m\n" "$1"; }

say "Checking Docker"
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sh
fi
systemctl enable --now docker >/dev/null 2>&1 || true

# Decide how HTTPS is served
if ss -ltnp 2>/dev/null | grep -E ':(80|443)\s' | grep -q nginx; then
  PROXY=nginx
else
  PROXY=caddy
fi
echo "HTTPS will be served by: $PROXY"

COMPOSE=(docker compose -f docker-compose.prod.yml --env-file "$ENV_FILE")
[ "$PROXY" = "caddy" ] && COMPOSE+=(--profile caddy)

if [ "$PROXY" = "caddy" ] && command -v ufw >/dev/null 2>&1 && ufw status | grep -q "Status: active"; then
  ufw allow 80/tcp && ufw allow 443/tcp && ufw allow 443/udp
fi

# A swap file keeps builds from running out of memory on small servers.
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
STOREFRONT_PORT=${STOREFRONT_PORT}
BACKEND_PORT=${BACKEND_PORT}
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

if [ "$PROXY" = "nginx" ]; then
  say "Adding ${DOMAIN} to nginx and getting HTTPS certificates"
  command -v certbot >/dev/null 2>&1 || { apt-get update -qq && apt-get install -y -qq certbot; }
  mkdir -p /var/www/letsencrypt
  CONF=/etc/nginx/conf.d/janki-store.conf
  CERT_DIR="/etc/letsencrypt/live/${DOMAIN}"

  if [ ! -f "${CERT_DIR}/fullchain.pem" ]; then
    # Plain HTTP first, so Let's Encrypt can check we control the domain.
    cat > "$CONF" <<EOF
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN} www.${DOMAIN} api.${DOMAIN};
    location /.well-known/acme-challenge/ { root /var/www/letsencrypt; }
    location / { return 301 https://\$host\$request_uri; }
}
EOF
    nginx -t && systemctl reload nginx
    certbot certonly --webroot -w /var/www/letsencrypt \
      -d "${DOMAIN}" -d "www.${DOMAIN}" -d "api.${DOMAIN}" \
      --cert-name "${DOMAIN}" --email "${ACME_EMAIL}" --agree-tos --non-interactive \
      --deploy-hook "systemctl reload nginx"
  fi

  cat > "$CONF" <<EOF
# Janki Design store (managed by deploy/setup-vps.sh, not by FASTPANEL)
server {
    listen 80;
    listen [::]:80;
    server_name ${DOMAIN} www.${DOMAIN} api.${DOMAIN};
    location /.well-known/acme-challenge/ { root /var/www/letsencrypt; }
    location / { return 301 https://\$host\$request_uri; }
}

server {
    listen 443 ssl;
    listen [::]:443 ssl;
    http2 on;
    server_name www.${DOMAIN};
    ssl_certificate ${CERT_DIR}/fullchain.pem;
    ssl_certificate_key ${CERT_DIR}/privkey.pem;
    return 301 https://${DOMAIN}\$request_uri;
}

server {
    listen 443 ssl;
    listen [::]:443 ssl;
    http2 on;
    server_name ${DOMAIN};
    ssl_certificate ${CERT_DIR}/fullchain.pem;
    ssl_certificate_key ${CERT_DIR}/privkey.pem;
    client_max_body_size 20m;
    location / {
        proxy_pass http://127.0.0.1:${STOREFRONT_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 120s;
    }
}

server {
    listen 443 ssl;
    listen [::]:443 ssl;
    http2 on;
    server_name api.${DOMAIN};
    ssl_certificate ${CERT_DIR}/fullchain.pem;
    ssl_certificate_key ${CERT_DIR}/privkey.pem;
    client_max_body_size 20m;
    location / {
        proxy_pass http://127.0.0.1:${BACKEND_PORT};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto https;
        proxy_read_timeout 120s;
    }
}
EOF
  # Older nginx versions don't know "http2 on;"
  if ! nginx -t >/dev/null 2>&1; then
    sed -i -e '/http2 on;/d' -e 's/listen 443 ssl;/listen 443 ssl http2;/' -e 's/listen \[::\]:443 ssl;/listen [::]:443 ssl http2;/' "$CONF"
  fi
  nginx -t && systemctl reload nginx
fi

say "Building and starting database, Redis and backend (first build takes 5-10 minutes)"
"${COMPOSE[@]}" up -d --build postgres redis backend

say "Waiting for the backend to be healthy"
status=starting
for i in $(seq 1 120); do
  status=$(docker inspect -f '{{.State.Health.Status}}' "$("${COMPOSE[@]}" ps -q backend)" 2>/dev/null || echo starting)
  [ "$status" = "healthy" ] && break
  sleep 5
done
[ "$status" = "healthy" ] || { echo "Backend did not become healthy. Logs:"; "${COMPOSE[@]}" logs --tail 80 backend; exit 1; }

KEY=$("${COMPOSE[@]}" exec -T postgres psql -U janki -d janki -tAc \
  "select token from api_key where type='publishable' and revoked_at is null order by created_at limit 1" | tr -d '[:space:]')
[ -n "$KEY" ] || { echo "No publishable key found in the database."; exit 1; }
sed -i "s/^MEDUSA_PUBLISHABLE_KEY=.*/MEDUSA_PUBLISHABLE_KEY=${KEY}/" "$ENV_FILE"

say "Attaching product photos from static/catalogue"
"${COMPOSE[@]}" exec -T backend npx medusa exec ./src/scripts/set-product-images.js \
  || echo "Could not update product photos; the rest of the update continues."

say "Building and starting the storefront"
# A fresh storefront container builds the site from the latest code and catalogue
"${COMPOSE[@]}" up -d --build --force-recreate storefront
[ "$PROXY" = "caddy" ] && "${COMPOSE[@]}" up -d caddy

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
