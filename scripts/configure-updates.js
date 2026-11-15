// Run in CI after `eas init`: points expo-updates at this project's EAS Update
// URL (https://u.expo.dev/<projectId>). Kept out of the committed app.json
// because the project id is only known once `eas init` has linked the project.
const fs = require("fs");
const path = require("path");

const file = path.join(__dirname, "..", "app.json");
const config = JSON.parse(fs.readFileSync(file, "utf8"));
const projectId = config.expo?.extra?.eas?.projectId;
if (!projectId) {
  console.error("Pas de projectId dans app.json : lancer `eas init` d'abord.");
  process.exit(1);
}
config.expo.updates = { ...config.expo.updates, url: `https://u.expo.dev/${projectId}` };
fs.writeFileSync(file, JSON.stringify(config, null, 2) + "\n");
console.log(`EAS Update -> https://u.expo.dev/${projectId} (runtime ${config.expo.runtimeVersion})`);
