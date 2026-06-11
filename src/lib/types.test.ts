import { describe, expect, it } from "vitest";
import { normalizeStatus, toArtist } from "./types";

describe("normalizeStatus", () => {
  it("maps stuck to in_process", () => {
    expect(normalizeStatus("stuck")).toBe("in_process");
  });

  it("keeps signed and unsigned", () => {
    expect(normalizeStatus("signed")).toBe("signed");
    expect(normalizeStatus("unsigned")).toBe("unsigned");
  });

  it("maps legacy firebase statuses", () => {
    expect(normalizeStatus("none")).toBe("unsigned");
    expect(normalizeStatus("rejected")).toBe("unsigned");
    expect(normalizeStatus("failed")).toBe("in_process");
  });
});

describe("toArtist", () => {
  it("maps odoo and handler fields", () => {
    const artist = toArtist({
      id: "1",
      nameHe: "Test",
      status: "signed",
      owner: "Handler",
      isOdooApproved: true,
      songCount: 3,
      email: "a@b.com",
      notes: "note",
      tag: "tag1",
      folderId: null,
      deletedAt: null,
      updatedAt: "2026-01-01T00:00:00.000Z",
    });
    expect(artist.isOdooApproved).toBe(true);
    expect(artist.handlerName).toBe("Handler");
    expect(artist.songCount).toBe(3);
  });
});
