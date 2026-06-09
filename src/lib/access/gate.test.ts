import { afterEach, describe, expect, it } from "vitest";
import { verifyGateUnlock } from "./gate";

describe("verifyGateUnlock", () => {
  const originalSecret = process.env.GATE_SECRET;
  const originalShortcut = process.env.GATE_ALLOW_SHORTCUT;

  afterEach(() => {
    process.env.GATE_SECRET = originalSecret;
    process.env.GATE_ALLOW_SHORTCUT = originalShortcut;
  });

  it("accepts matching password secret", () => {
    process.env.GATE_SECRET = "TEST123";
    expect(() => verifyGateUnlock({ method: "password", secret: "test123" })).not.toThrow();
  });

  it("rejects invalid password secret", () => {
    process.env.GATE_SECRET = "TEST123";
    expect(() => verifyGateUnlock({ method: "password", secret: "wrong" })).toThrow(
      "Invalid gate secret",
    );
  });

  it("allows shortcut when enabled", () => {
    process.env.GATE_ALLOW_SHORTCUT = "true";
    expect(() => verifyGateUnlock({ method: "shortcut" })).not.toThrow();
  });
});
