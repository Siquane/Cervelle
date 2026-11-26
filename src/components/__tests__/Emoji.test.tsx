import fs from "node:fs";
import path from "node:path";
import { hasEmoji, withEmojis } from "../Emoji";
import { EMOJI_IMAGES } from "../../lib/emojiImages";

describe("émojis en images 3D", () => {
  it("reconnaît un émoji avec ou sans sélecteur de variante", () => {
    expect(hasEmoji("🔥 3 jours")).toBe(true);
    expect(hasEmoji("Routine du matin ☀️")).toBe(true);
    expect(hasEmoji("Bonjour")).toBe(false);
  });

  it("garde le texte sans émoji tel quel", () => {
    expect(withEmojis("Bonjour", 16)).toBe("Bonjour");
  });

  it("a une image pour chaque émoji écrit dans les écrans", () => {
    const pat = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{2B50}\u{231A}-\u{23FF}]/u;
    const seen = new Set<string>();
    const walk = (dir: string) => {
      for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
        const p = path.join(dir, f.name);
        if (f.isDirectory()) {
          if (f.name !== "__tests__" && f.name !== "widgets") walk(p);
        } else if (/\.tsx$/.test(f.name)) {
          for (const line of fs.readFileSync(p, "utf8").split("\n")) {
            if (line.trim().startsWith("//") || line.trim().startsWith("*") || line.includes("Alert.alert")) continue;
            for (const ch of line.match(new RegExp(pat.source, "gu")) ?? []) seen.add(ch);
          }
        }
      }
    };
    walk(path.join(__dirname, "..", "..", "..", "app"));
    walk(path.join(__dirname, ".."));
    // ✓ is a check mark drawn with the font, not an emoji.
    const missing = [...seen].filter((e) => e !== "✓" && !EMOJI_IMAGES[e]);
    expect(missing).toEqual([]);
  });
});
