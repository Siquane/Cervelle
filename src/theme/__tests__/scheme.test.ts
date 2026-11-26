import { applyScheme, color, learnerColor, themed } from "../tokens";

describe("thème sans redémarrage", () => {
  it("change la palette sur place, et les valeurs calculées avec themed()", () => {
    applyScheme("dark");
    const palette = color;
    const table = themed(() => ({ fond: color.bg }));
    const list = themed(() => [color.bg, color.card]);
    const darkBg = color.bg;

    applyScheme("light");
    expect(color).toBe(palette); // même objet : le code qui l'a gardé voit les nouvelles couleurs
    expect(color.bg).not.toBe(darkBg);
    expect(table.fond).toBe(color.bg);
    expect(list[0]).toBe(color.bg);
    expect(learnerColor.violet.main).toBe("#8B5CF6");

    applyScheme("dark");
    expect(color.bg).toBe(darkBg);
    expect(table.fond).toBe(darkBg);
  });
});
