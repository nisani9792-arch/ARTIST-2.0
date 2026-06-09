#!/bin/sh
set -eu

echo "==> Running database migrations…"
node scripts/migrate-all.mjs

echo "==> Starting server…"
exec node server.js
