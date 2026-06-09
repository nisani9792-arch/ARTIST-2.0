import { describe, expect, it } from "vitest";
import { countOdooPending } from "./artist-stats";

describe("countOdooPending", () => {
  it("counts signed artists without Odoo approval", () => {
    const count = countOdooPending([
      { status: "signed", isOdooApproved: false },
      { status: "signed", isOdooApproved: true },
      { status: "in_process", isOdooApproved: false },
      { status: "unsigned", isOdooApproved: false },
    ]);
    expect(count).toBe(1);
  });

  it("returns zero when all signed are approved", () => {
    const count = countOdooPending([
      { status: "signed", isOdooApproved: true },
      { status: "unsigned", isOdooApproved: false },
    ]);
    expect(count).toBe(0);
  });
});
