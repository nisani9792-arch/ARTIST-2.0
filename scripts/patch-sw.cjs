const fs = require("fs");
const path = require("path");

const buildId =
  process.env.RENDER_GIT_COMMIT?.slice(0, 8) ||
  process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 8) ||
  String(Date.now());

const swPath = path.join(__dirname, "..", "public", "sw.js");
let content = fs.readFileSync(swPath, "utf8");
content = content.replace(/__BUILD_ID__/g, buildId);
fs.writeFileSync(swPath, content);
console.log(`Patched sw.js with build id: ${buildId}`);
