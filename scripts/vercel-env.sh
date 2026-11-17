#!/usr/bin/env bash
# Pushes the production environment variables from your local .env to the linked Vercel project.
# DATABASE_URL is switched to Supabase's TRANSACTION pooler (port 6543), required for serverless.
set -euo pipefail
cd "$(dirname "$0")/.."
get() { grep -E "^$1=" .env | head -1 | cut -d= -f2-; }

DB_URL="$(get DATABASE_URL)"
DB_URL="${DB_URL/:5432\//:6543/}"
DB_URL="${DB_URL%%\?*}?pgbouncer=true&connection_limit=1&sslmode=require"

set_var() {
  npx --yes vercel env rm "$1" production --yes >/dev/null 2>&1 || true
  printf '%s' "$2" | npx --yes vercel env add "$1" production >/dev/null
  echo "  set $1"
}

echo "Setting Vercel production environment variables..."
set_var DATABASE_URL "$DB_URL"
set_var AI_PROVIDER "$(get AI_PROVIDER)"
set_var AI_API_KEY "$(get AI_API_KEY)"
set_var AI_MODEL "$(get AI_MODEL)"
set_var AI_FALLBACK_MODELS "$(get AI_FALLBACK_MODELS)"
set_var SESSION_SECRET "$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")"
echo "Done."
