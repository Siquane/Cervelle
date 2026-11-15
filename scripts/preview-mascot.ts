import fs from "node:fs";
import { mascotSvg } from "./mascot-svg";
const ids = ["", "casquette", "couronne", "toque", "sorcier", "casque", "lunettes", "masque", "noeud", "echarpe"];
const html = `<html><body style="margin:0;background:#F3F6FB;display:flex;flex-wrap:wrap;gap:8px;padding:8px">${ids
  .map((id) => `<div style="width:180px;height:180px;background:#fff;border-radius:16px">${mascotSvg({ accessories: id ? [id] : [] })}</div>`)
  .join("")}</body></html>`;
fs.writeFileSync(process.argv[2], html);
