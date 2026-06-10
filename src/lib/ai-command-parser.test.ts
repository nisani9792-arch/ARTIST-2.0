import { describe, expect, it } from "vitest";
import {
  extractEntriesFromText,
  parseLocalHebrewCommand,
  parseNameLine,
} from "./ai-command-parser";

describe("parseNameLine", () => {
  it("strips numbering and notes", () => {
    expect(parseNameLine("2. מוטי וייס - לקראת סיום")).toEqual({
      name: "מוטי וייס",
      note: "לקראת סיום",
    });
    expect(parseNameLine("1. משה לוק")).toEqual({ name: "משה לוק" });
  });
});

describe("extractEntriesFromText", () => {
  it("parses numbered user list", () => {
    const text = `1. משה לוק
2. מוטי וייס - לקראת סיום
3. דוד קיי
12. משה ולדר`;
    const entries = extractEntriesFromText(text);
    expect(entries).toHaveLength(4);
    expect(entries[0].name).toBe("משה לוק");
    expect(entries[1]).toEqual({ name: "מוטי וייס", note: "לקראת סיום" });
    expect(entries[3].name).toBe("משה ולדר");
  });
});

describe("parseLocalHebrewCommand", () => {
  it("parses multiline name list with instruction", () => {
    const cmd = `סמן את האומנים הבאים כחתום:
אבי זוהר
דני כהן`;
    const result = parseLocalHebrewCommand(cmd);
    expect(result?.action).toBe("upsert_by_names");
    if (result?.action === "upsert_by_names") {
      expect(result.entries.map((e) => e.name)).toEqual(["אבי זוהר", "דני כהן"]);
      expect(result.status).toBe("signed");
      expect(result.createMissing).toBe(true);
    }
  });

  it("parses plain numbered list without instruction", () => {
    const cmd = `1. משה לוק
2. מוטי וייס - לקראת סיום
12. משה ולדר`;
    const result = parseLocalHebrewCommand(cmd);
    expect(result?.action).toBe("upsert_by_names");
    if (result?.action === "upsert_by_names") {
      expect(result.entries).toHaveLength(3);
      expect(result.entries[1].note).toBe("לקראת סיום");
      expect(result.status).toBe("in_process");
      expect(result.createMissing).toBe(true);
    }
  });

  it("parses bulk odoo command", () => {
    const result = parseLocalHebrewCommand("אשר Odoo לכל החתומים");
    expect(result).toEqual({
      action: "bulk_odoo",
      isOdooApproved: true,
      filter: { status: "signed" },
    });
  });
});
