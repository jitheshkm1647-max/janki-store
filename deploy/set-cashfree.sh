#!/usr/bin/env bash
# Turns on Cashfree online payments (UPI, cards, netbanking) for the live store.
# Run on the VPS as root:
#
#   cd /opt/janki-store && git pull && bash deploy/set-cashfree.sh
#
# It asks for the Cashfree App ID and Secret Key (the secret is hidden), works
# out whether they are test or live keys, checks them with Cashfree, saves them
# in deploy/.env.production, restarts the store and enables Cashfree at checkout.
# Run it again any time to switch from Test to Live keys.

set -euo pipefail
cd "$(dirname "$0")/.."
ENV_FILE="deploy/.env.production"
[ -f "$ENV_FILE" ] || { echo "Run deploy/setup-vps.sh first."; exit 1; }
COMPOSE=(docker compose -f docker-compose.prod.yml --env-file "$ENV_FILE")

say() { printf "\n\033[1;35m==> %s\033[0m\n" "$1"; }

echo "Cashfree dashboard → Developers → API Keys. Paste the two keys below."
echo "(Live or test is detected from the Secret Key. Press Ctrl+C to stop.)"

check_keys() {
  local api=$1
  curl -s --max-time 20 -o /dev/null -w '%{http_code}' "$api/orders/janki-key-check" \
    -H "x-client-id: $CLIENT_ID" -H "x-client-secret: $CLIENT_SECRET" -H "x-api-version: 2025-01-01"
}

for attempt in 1 2 3; do
  read -rp "App ID: " CLIENT_ID
  read -rsp "Secret Key (hidden while you paste): " CLIENT_SECRET; echo
  CLIENT_ID="$(printf %s "$CLIENT_ID" | tr -d '[:space:]')"
  CLIENT_SECRET="$(printf %s "$CLIENT_SECRET" | tr -d '[:space:]')"

  case "${CLIENT_ID,,}" in
    ""|live|test|production|sandbox)
      echo "That is not an App ID. Paste the App ID from Cashfree (a long code of letters and numbers)."
      continue ;;
  esac
  if [ -z "$CLIENT_SECRET" ]; then
    echo "The Secret Key was empty. Paste it at the Secret Key line."
    continue
  fi

  case "$CLIENT_SECRET" in
    *_prod_*) ORDER=(production) ;;
    *_test_*) ORDER=(sandbox) ;;
    *) ORDER=(production sandbox) ;;
  esac

  say "Checking the keys with Cashfree"
  ENVIRONMENT=""
  for envname in "${ORDER[@]}"; do
    if [ "$envname" = production ]; then API=https://api.cashfree.com/pg; else API=https://sandbox.cashfree.com/pg; fi
    CODE=$(check_keys "$API")
    if [ "$CODE" != "401" ] && [ "$CODE" != "403" ] && [ "$CODE" != "000" ]; then
      ENVIRONMENT=$envname
      break
    fi
  done
  [ -n "$ENVIRONMENT" ] && break

  if [ "$CODE" = "000" ]; then
    echo "Could not reach Cashfree from this server. Check the internet connection and try again."
    exit 1
  fi
  echo "Cashfree did not accept these keys (HTTP $CODE)."
  echo "Copy the App ID and Secret Key again from the same key pair in Cashfree → Developers → API Keys."
  echo "If your account is not yet activated for live payments, use your Test keys for now."
  [ "$attempt" -lt 3 ] && echo "Try again:"
done
[ -n "$ENVIRONMENT" ] || exit 1
if [ "$ENVIRONMENT" = production ]; then MODE=live; else MODE=test; fi
echo "Keys accepted."

set_var() {
  if grep -q "^$1=" "$ENV_FILE"; then
    sed -i "s|^$1=.*|$1=$2|" "$ENV_FILE"
  else
    echo "$1=$2" >> "$ENV_FILE"
  fi
}
set_var CASHFREE_CLIENT_ID "$CLIENT_ID"
set_var CASHFREE_CLIENT_SECRET "$CLIENT_SECRET"
set_var CASHFREE_ENVIRONMENT "$ENVIRONMENT"
chmod 600 "$ENV_FILE"

say "Restarting the backend with Cashfree"
"${COMPOSE[@]}" up -d --build --force-recreate backend
status=starting
for i in $(seq 1 90); do
  status=$(docker inspect -f '{{.State.Health.Status}}' "$("${COMPOSE[@]}" ps -q backend)" 2>/dev/null || echo starting)
  [ "$status" = "healthy" ] && break
  sleep 5
done
[ "$status" = "healthy" ] || { echo "Backend did not start. Logs:"; "${COMPOSE[@]}" logs --tail 60 backend; exit 1; }

say "Adding Cashfree to checkout"
"${COMPOSE[@]}" exec -T backend npx medusa exec ./src/scripts/enable-cashfree.js

say "Rebuilding the storefront (about 3-5 minutes)"
"${COMPOSE[@]}" up -d --force-recreate storefront

say "Done"
echo "Cashfree ($MODE) is on. Checkout now offers Cashfree and Cash on Delivery."
echo "Payment updates are sent to https://api.$(grep '^DOMAIN=' "$ENV_FILE" | cut -d= -f2)/hooks/payment/cashfree_cashfree"
