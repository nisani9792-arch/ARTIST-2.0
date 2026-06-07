#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
export PATH="$(pwd):${PATH}"
npm ci
npm run build
