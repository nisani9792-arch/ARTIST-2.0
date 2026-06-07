/**
 * Render workaround: some dashboards have typo "pm install" instead of "npm install".
 * npm install runs preinstall first → this puts `pm` on PATH (node_modules/.bin).
 */
const fs = require("fs");
const path = require("path");

const binDir = path.join(process.cwd(), "node_modules", ".bin");
fs.mkdirSync(binDir, { recursive: true });

const pmPath = path.join(binDir, "pm");
const content =
  process.platform === "win32"
    ? '@echo off\r\nnpm %*\r\n'
    : '#!/usr/bin/env sh\nexec npm "$@"\n';

fs.writeFileSync(pmPath, content, { mode: 0o755 });
