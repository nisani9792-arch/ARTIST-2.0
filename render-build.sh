#!/usr/bin/env bash
# Build script for Render — use as Build Command: bash render-build.sh
set -euo pipefail
cd "$(dirname "$0")"

export PATH="${PWD}/node_modules/.bin:${PWD}:${PATH}"

echo "==> Installing dependencies..."
npm ci

if [ -n "${DATABASE_URL:-}${ARTIST_DATABASE_URL:-}" ]; then
  echo "==> DB migrations..."
  npm run db:migrate-song-count || echo "WARN: song_count migration skipped"
  npm run db:migrate-legacy-fields || echo "WARN: legacy fields migration skipped"
  npm run db:migrate-all || echo "WARN: migrate-all skipped"
fi

echo "==> Building Next.js..."
npm run build

echo "==> Build complete."
