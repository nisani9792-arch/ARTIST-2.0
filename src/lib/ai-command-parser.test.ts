import { describe, expect, it } from "vitest";
import { parseLocalHebrewCommand } from "./ai-command-parser";

describe("parseLocalHebrewCommand", () => {
  it("parses multiline name list with instruction", () => {
    const cmd = `סמן את האומנים הבאים כחתום:
אבי זוהר
דני כהן
יוסי לוי`;
    const result = parseLocalHebrewCommand(cmd);
    expect(result?.action).toBe("update_by_names");
    if (result?.action === "update_by_names") {
      expect(result.names).toEqual(["אבי זוהר", "דני כהן", "יוסי לוי"]);
      expect(result.status).toBe("signed");
    }
  });

  it("parses comma-separated names", () => {
    const result = parseLocalHebrewCommand("סמן את אבי זוהר, דני כהן כחתום");
    expect(result?.action).toBe("update_by_names");
    if (result?.action === "update_by_names") {
      expect(result.names).toContain("אבי זוהר");
      expect(result.status).toBe("signed");
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

  it("parses create artist", () => {
    const result = parseLocalHebrewCommand('צור אומן חדש בשם "רון אלבז"');
    expect(result?.action).toBe("create_artist");
    if (result?.action === "create_artist") {
      expect(result.name).toBe("רון אלבז");
    }
  });
});
