import { describe, expect, it } from "vitest";
import { encodeArtistIdForPath, normalizeArtistId } from "./artist-id";

describe("normalizeArtistId", () => {
  it("decodes percent-encoded Hebrew ids", () => {
    const hebrew = "אבי-זוהר";
    expect(normalizeArtistId(encodeURIComponent(hebrew))).toBe(hebrew);
  });

  it("handles already-decoded ids", () => {
    expect(normalizeArtistId("אבי-זוהר")).toBe("אבי-זוהר");
  });

  it("trims whitespace", () => {
    expect(normalizeArtistId("  test-id  ")).toBe("test-id");
  });
});

describe("encodeArtistIdForPath", () => {
  it("encodes Hebrew for URL paths", () => {
    const encoded = encodeArtistIdForPath("אבי-זוהר");
    expect(encoded).not.toContain("א");
    expect(decodeURIComponent(encoded)).toBe("אבי-זוהר");
  });
});
