import { describe, expect, it } from "vitest";
import { artistNameKey, namesAreSimilar, normalizeArtistName } from "./artist-names";

describe("normalizeArtistName", () => {
  it("normalizes final mem to regular mem", () => {
    expect(artistNameKey("משה לוק")).toBe(artistNameKey("משה לוק"));
    expect(normalizeArtistName("  משה   לוק  ")).toBe("משה לוק");
  });

  it("treats חתומים-style spelling consistently", () => {
    const a = artistNameKey("דני כהן");
    const b = artistNameKey("דני  כהן");
    expect(a).toBe(b);
  });
});

describe("namesAreSimilar", () => {
  it("matches exact normalized names", () => {
    expect(namesAreSimilar("משה לוק", "משה לוק")).toBe(true);
  });

  it("detects contained names", () => {
    expect(namesAreSimilar("משה לוק", "משה לוק הרכב")).toBe(true);
  });
});
