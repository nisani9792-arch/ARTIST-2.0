import { beforeEach, describe, expect, it } from "vitest";
import { useUiStore } from "./useUiStore";

describe("resizeAdjacentColumns", () => {
  beforeEach(() => {
    useUiStore.getState().resetColumnLayout();
  });

  it("adjusts both column widths symmetrically", () => {
    const store = useUiStore.getState();
    store.resizeAdjacentColumns("in_process", "signed", 10);
    const { columnWidths } = useUiStore.getState();
    expect(columnWidths.in_process + columnWidths.signed).toBeCloseTo(100, 1);
    expect(columnWidths.in_process).toBeGreaterThan(50);
    expect(columnWidths.signed).toBeLessThan(50);
  });

  it("respects minimum column width", () => {
    const store = useUiStore.getState();
    store.resizeAdjacentColumns("in_process", "signed", -200);
    const { columnWidths } = useUiStore.getState();
    expect(columnWidths.in_process).toBeGreaterThanOrEqual(22);
    expect(columnWidths.signed).toBeGreaterThanOrEqual(22);
  });
});
