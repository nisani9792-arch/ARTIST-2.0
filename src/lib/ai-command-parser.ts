import type { AiCommand } from "./gemini";
import type { ArtistStatus } from "./types";

const INSTRUCTION_RE =
  /^(סמן|שנה|העבר|צור|אשר|בטל|רשימה|להלן|הבאים|כל|אומנים|מטפל|גורם|odoo|חתום|חתומים|לא חתום|בעבודה)/i;

function parseStatus(text: string): ArtistStatus | undefined {
  if (/לא\s*חתום/i.test(text)) return "unsigned";
  if (/בעבודה|בתהליך|בתהליך/i.test(text)) return "in_process";
  if (/חתום/i.test(text)) return "signed";
  return undefined;
}

function cleanName(raw: string): string {
  return raw
    .replace(/^[-•*·]\s*/, "")
    .replace(/^ו-?/, "")
    .replace(/["'״]/g, "")
    .replace(/\s*(כחתום|כלא חתום|לבעבודה|כבעבודה)\s*$/i, "")
    .trim();
}

function splitNameTokens(segment: string): string[] {
  return segment
    .split(/[,،、\n|]+/)
    .map((part) => cleanName(part))
    .filter((name) => name.length >= 2);
}

function extractNamesFromLines(lines: string[]): string[] {
  const names: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || INSTRUCTION_RE.test(trimmed)) continue;
    if (/^(כחתום|כלא חתום|לבעבודה)/i.test(trimmed)) continue;
    names.push(...splitNameTokens(trimmed));
  }
  return [...new Set(names)];
}

function extractNamesFromSingleLine(text: string): string[] {
  const patterns = [
    /(?:את|אתם|האומנים|הרשימה|רשימת)\s*(?:הבאים|הבאות)?\s*:?\s*(.+?)\s*(?:כ|ל|—|-)\s*(?:חתום|לא חתום|בעבודה)/i,
    /(?:סמן|שנה|העבר)\s+(?:את\s+)?(.+?)\s+(?:כ|ל)(?:חתום|לא חתום|בעבודה)/i,
    /:\s*(.+)$/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      const names = splitNameTokens(match[1]);
      if (names.length > 0) return names;
    }
  }

  return [];
}

/**
 * Fast local parser for Hebrew CRM commands — especially multiline name lists.
 * Returns null when Gemini should be used as fallback.
 */
export function parseLocalHebrewCommand(command: string): AiCommand | null {
  const text = command.trim();
  if (text.length < 2) return null;

  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const actionText = lines.join(" ");

  const createMatch = text.match(
    /צור\s+(?:אומן\s+)?(?:חדש\s+)?(?:בשם\s+)?["']?([^"'\n]+?)["']?(?:\s+כ|\s*$)/i,
  );
  if (createMatch) {
    const name = cleanName(createMatch[1]);
    if (name) {
      return {
        action: "create_artist",
        name,
        status: parseStatus(actionText) ?? "unsigned",
        isOdooApproved: /אשר\s*odoo/i.test(actionText) ? true : undefined,
      };
    }
  }

  if (/אשר\s*odoo|אישור\s*odoo/i.test(actionText) && !/בטל/i.test(actionText)) {
    return {
      action: "bulk_odoo",
      isOdooApproved: true,
      filter: { status: parseStatus(actionText) ?? "signed" },
    };
  }

  if (/בטל\s*odoo/i.test(actionText)) {
    return {
      action: "bulk_odoo",
      isOdooApproved: false,
      filter: { status: parseStatus(actionText) },
    };
  }

  const handlerMatch = actionText.match(/(?:מטפל|גורם מטפל)\s+["']?([^"'\n,]+?)["']?(?:\s|$|,)/i);

  let names =
    lines.length > 1
      ? extractNamesFromLines(lines)
      : extractNamesFromSingleLine(text);

  if (names.length === 0 && lines.length > 1) {
    names = extractNamesFromLines(lines.filter((l) => !/סמן|שנה|העבר|אשר|בטל/i.test(l)));
  }

  const status = parseStatus(actionText);
  const odooApprove = /אשר\s*odoo/i.test(actionText);
  const odooRevoke = /בטל\s*odoo/i.test(actionText);

  if (names.length > 0) {
    if (status || odooApprove || odooRevoke || handlerMatch) {
      return {
        action: "update_by_names",
        names,
        status,
        handlerName: handlerMatch?.[1]?.trim(),
        isOdooApproved: odooApprove ? true : odooRevoke ? false : undefined,
      };
    }
  }

  if (/כל\s+(?:ה)?לא\s*חתומים/i.test(actionText) && status) {
    return {
      action: "mark_status",
      status,
      filter: { fromStatus: "unsigned" },
    };
  }

  const handlerFilter = actionText.match(/של\s+["']?([^"'\n]+?)["']?\s+(?:ל|כ)/i);

  if (/כל\s+(?:ה)?חתומים/i.test(actionText) && status) {
    return {
      action: "mark_status",
      status,
      filter: { fromStatus: "signed", handlerName: handlerFilter?.[1]?.trim() },
    };
  }

  if (/כל\s+(?:ה)?לא\s*חתומים/i.test(actionText) && handlerMatch) {
    return {
      action: "reassign_handler",
      toHandler: handlerMatch[1].trim(),
      filter: { status: "unsigned" },
    };
  }

  const reassign = actionText.match(
    /(?:שנה|העבר)\s+(?:מטפל|גורם)?\s*(?:מ)?["']?([^"'\n]+?)["']?\s+(?:ל|אל)\s+["']?([^"'\n]+?)["']?/i,
  );
  if (reassign) {
    return {
      action: "reassign_handler",
      fromHandler: reassign[1].trim(),
      toHandler: reassign[2].trim(),
      filter: { status: parseStatus(actionText) },
    };
  }

  if (status && /כל\s+(?:ה)?/i.test(actionText)) {
    const fromStatus =
      /לא\s*חתומים/i.test(actionText)
        ? "unsigned"
        : /בעבודה/i.test(actionText)
          ? "in_process"
          : /חתומים/i.test(actionText)
            ? "signed"
            : undefined;
    return {
      action: "mark_status",
      status,
      filter: { fromStatus, handlerName: handlerFilter?.[1]?.trim() },
    };
  }

  return null;
}
