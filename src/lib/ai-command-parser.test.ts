import { describe, expect, it } from "vitest";
import {
  extractEntriesFromText,
  parseLocalHebrewCommand,
  parseNameLine,
  parseSingleLineCommand,
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

describe("parseSingleLineCommand", () => {
  it("parses add artist in process command", () => {
    const result = parseSingleLineCommand("משה לוק להוסיף אומן במצב בעבודה");
    expect(result?.action).toBe("upsert_by_names");
    if (result?.action === "upsert_by_names") {
      expect(result.entries).toEqual([{ name: "משה לוק" }]);
      expect(result.status).toBe("in_process");
      expect(result.createMissing).toBe(true);
    }
  });

  it("parses mark as signed", () => {
    const result = parseSingleLineCommand("סמן את דני כהן כחתום");
    expect(result?.action).toBe("upsert_by_names");
    if (result?.action === "upsert_by_names") {
      expect(result.entries[0].name).toBe("דני כהן");
      expect(result.status).toBe("signed");
    }
  });

  it("parses prefix add command", () => {
    const result = parseSingleLineCommand("הוסף יוסי לוי בעבודה");
    expect(result?.action).toBe("upsert_by_names");
    if (result?.action === "upsert_by_names") {
      expect(result.entries[0].name).toBe("יוסי לוי");
      expect(result.status).toBe("in_process");
    }
  });
});

describe("parseLocalHebrewCommand", () => {
  it("parses add artist via single line", () => {
    const result = parseLocalHebrewCommand("משה לוק להוסיף אומן במצב בעבודה");
    expect(result?.action).toBe("upsert_by_names");
    if (result?.action === "upsert_by_names") {
      expect(result.entries[0].name).toBe("משה לוק");
      expect(result.status).toBe("in_process");
    }
  });

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
