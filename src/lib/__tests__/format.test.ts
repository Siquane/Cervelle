import { de, duration, shortDate } from "../format";

describe("format", () => {
  it("writes durations the French way", () => {
    expect(duration(21 * 60)).toBe("21 min");
    expect(duration(65 * 60)).toBe("1 h 05");
  });
  it("writes short dates", () => {
    expect(shortDate("2026-11-12")).toBe("12 nov.");
  });
});

describe("de", () => {
  it("elides before a vowel, accents included", () => {
    expect(de("Léo")).toBe("de Léo");
    expect(de("Anaïs")).toBe("d'Anaïs");
    expect(de("Élise")).toBe("d'Élise");
    expect(de("emma")).toBe("d'emma");
    expect(de("Hugo")).toBe("de Hugo");
  });
});
