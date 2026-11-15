import fs from "node:fs";
import path from "node:path";
import { chromium } from "playwright";
import { mascotSvg } from "./mascot-svg";

// Generates the app icon, Android adaptive icon layers, splash image and
// favicon from the mascot drawing. Run: npm run assets (needs Playwright).

const out = path.join(__dirname, "..", "assets");

async function render(file: string, px: number, html: string, transparent: boolean) {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: px, height: px }, deviceScaleFactor: 1 });
  await page.setContent(`<html><body style="margin:0;width:${px}px;height:${px}px;overflow:hidden;${transparent ? "background:transparent" : ""}">${html}</body></html>`);
  await page.screenshot({ path: path.join(out, file), omitBackground: transparent });
  await browser.close();
}

const centered = (scale: number, bg: string | null, accessories: string[] = []) =>
  `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;${bg ? `background:${bg}` : ""}"><div style="width:${scale * 100}%;height:${scale * 100}%">${mascotSvg({ accessories, viewBox: "8 26 190 150" })}</div></div>`;

(async () => {
  fs.mkdirSync(out, { recursive: true });
  await render("icon.png", 1024, centered(0.78, "#FFE3EC", ["lunettes"]), false);
  // Adaptive icon: the system crops to a circle/squircle, keep the drawing in the inner 60 %.
  await render("android-icon-foreground.png", 1024, centered(0.56, null, ["lunettes"]), true);
  await render("android-icon-background.png", 1024, `<div style="width:100%;height:100%;background:#FFE3EC"></div>`, false);
  await render("android-icon-monochrome.png", 1024, centered(0.56, null).replace(/#FF8FB1/g, "#000"), true);
  await render("splash-icon.png", 512, centered(0.9, null, ["lunettes"]), true);
  await render("favicon.png", 64, centered(0.95, null), true);
  console.log("assets written to", out);
})();
