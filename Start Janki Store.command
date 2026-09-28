#!/bin/bash
# Double-click this file to start the Janki Design store.
# First run installs everything (5-10 minutes). Later runs start in about a minute.

cd "$(dirname "$0")" || exit 1
export PATH="/usr/local/bin:/opt/homebrew/bin:/Applications/Docker.app/Contents/Resources/bin:$PATH"

step() { printf "\n\033[1;35m==> %s\033[0m\n" "$1"; }
fail() { printf "\n\033[1;31mProblem: %s\033[0m\n" "$1"; read -r -p "Press Return to close."; exit 1; }

step "Checking Node.js"
command -v node >/dev/null || fail "Node.js is not installed. Run node-v24.21.0.pkg from Downloads."
node -v

step "Checking Docker"
if ! docker info >/dev/null 2>&1; then
  echo "Starting Docker Desktop... (accept the agreement and enter your password if asked)"
  open -a Docker
  for i in $(seq 1 90); do docker info >/dev/null 2>&1 && break; sleep 2; done
  docker info >/dev/null 2>&1 || fail "Docker did not start. Open Docker from Applications, finish its setup, then double-click this file again."
fi
echo "Docker is running."

if [ ! -d node_modules ] || [ ! -d apps/storefront/node_modules ]; then
  step "Installing packages (first run only, takes a few minutes)"
  npm run setup || fail "Package install failed. Check your internet connection and try again."
fi

step "Starting database and Redis"
npm run db:up || fail "Could not start the database containers."
for i in $(seq 1 30); do docker compose exec -T postgres pg_isready -U postgres >/dev/null 2>&1 && break; sleep 2; done

step "Updating database"
npm run db:migrate || fail "Database migration failed."

step "Connecting storefront to backend"
npm run storefront:key || fail "Could not write the storefront key."

if [ ! -f .admin-created ]; then
  step "Creating admin login (admin@jankidesign.com / ChangeMe123!)"
  npm run admin:create && touch .admin-created
fi

step "Starting the store"
echo "Shop:  http://localhost:8000"
echo "Admin: http://localhost:9000/app"
echo "Keep this window open while you use the store. Close it to stop."
( sleep 45; open "http://localhost:8000" ) &
npm run dev
