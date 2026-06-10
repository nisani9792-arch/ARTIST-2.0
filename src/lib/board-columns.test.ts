import { describe, expect, it } from "vitest";
import {
  artistMatchesColumn,
  columnDropPatch,
  filterArtistsForColumn,
  migrateColumnOrder,
  migrateColumnWidths,
} from "./board-columns";
import type { Artist } from "./types";

const base = (overrides: Partial<Artist>): Artist => ({
  id: "1",
  name: "Test",
  status: "signed",
  isOdooApproved: false,
  songCount: 0,
  handlerName: "",
  email: "",
  notes: "",
  tag: "",
  folderId: null,
  deletedAt: null,
  lastActionTimestamp: "",
  ...overrides,
});

describe("board columns", () => {
  it("splits signed artists by odoo approval", () => {
    const artists = [
      base({ id: "a", status: "signed", isOdooApproved: false }),
      base({ id: "b", status: "signed", isOdooApproved: true }),
      base({ id: "c", status: "in_process" }),
    ];
    expect(filterArtistsForColumn(artists, "signed_pending_odoo")).toHaveLength(1);
    expect(filterArtistsForColumn(artists, "signed_approved")).toHaveLength(1);
    expect(filterArtistsForColumn(artists, "in_process")).toHaveLength(1);
  });

  it("maps drop to status and odoo flag", () => {
    expect(columnDropPatch("signed_approved")).toEqual({
      status: "signed",
      isOdooApproved: true,
    });
    expect(columnDropPatch("signed_pending_odoo")).toEqual({
      status: "signed",
      isOdooApproved: false,
    });
  });

  it("detects same column for drag noop", () => {
    const artist = base({ status: "signed", isOdooApproved: false });
    expect(artistMatchesColumn(artist, "signed_pending_odoo")).toBe(true);
    expect(artistMatchesColumn(artist, "signed_approved")).toBe(false);
  });

  it("migrates legacy two-column layout", () => {
    expect(migrateColumnOrder(["signed", "in_process"])).toEqual([
      "signed_pending_odoo",
      "signed_approved",
      "in_process",
    ]);
    const widths = migrateColumnWidths({ signed: 60, in_process: 40 }, [
      "signed_pending_odoo",
      "signed_approved",
      "in_process",
    ]);
    expect(widths.in_process).toBeCloseTo(40, 0);
    expect(widths.signed_pending_odoo + widths.signed_approved).toBeCloseTo(60, 0);
  });
});
