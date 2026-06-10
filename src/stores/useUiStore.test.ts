import { beforeEach, describe, expect, it } from "vitest";
import { useUiStore } from "./useUiStore";

describe("resizeAdjacentColumns", () => {
  beforeEach(() => {
    useUiStore.getState().resetColumnLayout();
  });

  it("adjusts both column widths symmetrically", () => {
    const store = useUiStore.getState();
    store.resizeAdjacentColumns("in_process", "signed_pending_odoo", 10);
    const { columnWidths } = useUiStore.getState();
    expect(columnWidths.in_process + columnWidths.signed_pending_odoo).toBeCloseTo(100, 1);
    expect(columnWidths.in_process).toBeGreaterThan(34);
    expect(columnWidths.signed_pending_odoo).toBeLessThan(columnWidths.in_process);
  });

  it("respects minimum column width", () => {
    const store = useUiStore.getState();
    store.resizeAdjacentColumns("signed_pending_odoo", "signed_approved", -200);
    const { columnWidths } = useUiStore.getState();
    expect(columnWidths.signed_pending_odoo).toBeGreaterThanOrEqual(18);
    expect(columnWidths.signed_approved).toBeGreaterThanOrEqual(18);
  });
});
