// Run in CI before a build or an update. Puts back what stays out of the public
// repo, read from GitHub secrets:
//   API_URL              → EXPO_PUBLIC_API_URL of the eas.json build profiles
//   GOOGLE_SERVICES_JSON → google-services.json (Firebase, Android notifications)
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const apiUrl = process.env.API_URL;
if (!apiUrl) {
  console.error("Secret API_URL manquant : GitHub → Settings → Secrets and variables → Actions.");
  process.exit(1);
}

const easFile = path.join(root, "eas.json");
const eas = JSON.parse(fs.readFileSync(easFile, "utf8"));
for (const profile of Object.values(eas.build ?? {})) {
  profile.env = { ...profile.env, EXPO_PUBLIC_API_URL: apiUrl };
}
fs.writeFileSync(easFile, JSON.stringify(eas, null, 2) + "\n");
console.log("eas.json : adresse du serveur ajoutée.");

const gs = process.env.GOOGLE_SERVICES_JSON;
if (gs) {
  JSON.parse(gs); // stops here if the secret is not valid JSON
  fs.writeFileSync(path.join(root, "google-services.json"), gs);
  console.log("google-services.json écrit.");
} else if (process.argv.includes("--build")) {
  console.error("Secret GOOGLE_SERVICES_JSON manquant : il faut le contenu de google-services.json (Firebase).");
  process.exit(1);
}
