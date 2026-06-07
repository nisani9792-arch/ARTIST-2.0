#!/usr/bin/env node
const { spawnSync } = require("child_process");
const args = process.argv.slice(2);
const result = spawnSync("npm", args, { stdio: "inherit", shell: true });
process.exit(result.status ?? 1);
