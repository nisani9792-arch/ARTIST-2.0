import type { AiCommand } from "./gemini";
import type { ArtistStatus } from "./types";

export type ParsedNameEntry = {
  name: string;
  note?: string;
};

const INSTRUCTION_RE =
  /^(סמן|שנה|העבר|צור|הוסף|להוסיף|אשר|בטל|רשימה|להלן|הבאים|כל|אומנים|מטפל|גורם|odoo|חתום|חתומים|לא חתום|בעבודה)/i;

const NUMBERED_LINE_RE = /^\d+[\.\)]\s*.+/;

function parseStatus(text: string): ArtistStatus | undefined {
  if (/לא\s*חתום/i.test(text)) return "unsigned";
  if (/בעבודה|בתהליך/i.test(text)) return "in_process";
  if (/חתום/i.test(text)) return "signed";
  return undefined;
}

function cleanName(raw: string): string {
  return raw
    .replace(/^[-•*·]\s*/, "")
    .replace(/^ו-?/, "")
    .replace(/["'״]/g, "")
    .replace(/\s*(?:במצב\s+)?(כחתום|כלא חתום|לבעבודה|כבעבודה|חתום|לא חתום|בעבודה)\s*$/i, "")
    .trim();
}

/** Parse one line — supports "1. שם", "2. שם - הערה", bullets. */
export function parseNameLine(line: string): ParsedNameEntry | null {
  let trimmed = line.trim();
  if (!trimmed || INSTRUCTION_RE.test(trimmed)) return null;
  if (/^(כחתום|כלא חתום|לבעבודה)/i.test(trimmed)) return null;

  trimmed = trimmed.replace(/^\d+[\.\)]\s*/, "");

  const noteMatch = trimmed.match(/^(.+?)\s*[-–—]\s+(.+)$/);
  if (noteMatch) {
    const name = cleanName(noteMatch[1]);
    const note = noteMatch[2].trim();
    if (/^(לקראת|להשלים|השלמת)/i.test(note)) {
      return name.length >= 2 ? { name, note } : null;
    }
    return name.length >= 2 ? { name, note: note || undefined } : null;
  }

  const name = cleanName(trimmed);
  return name.length >= 2 ? { name } : null;
}

export function extractEntriesFromText(text: string): ParsedNameEntry[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const entries: ParsedNameEntry[] = [];

  for (const line of lines) {
    const entry = parseNameLine(line);
    if (entry) entries.push(entry);
  }

  if (entries.length === 0) {
    for (const part of text.split(/[,،、|]+/)) {
      const entry = parseNameLine(part);
      if (entry) entries.push(entry);
    }
  }

  const seen = new Set<string>();
  return entries.filter((e) => {
    const key = e.name.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function isMostlyNameList(lines: string[]): boolean {
  if (lines.length < 2) return false;
  const nameLike = lines.filter((l) => parseNameLine(l) || NUMBERED_LINE_RE.test(l.trim()));
  return nameLike.length >= 2 && nameLike.length >= lines.length * 0.6;
}

function extractNamesFromSingleLine(text: string): ParsedNameEntry[] {
  const patterns = [
    /(?:את|אתם|האומנים|הרשימה|רשימת)\s*(?:הבאים|הבאות)?\s*:?\s*(.+)$/i,
    /(?:סמן|שנה|העבר)\s+(?:את\s+)?(.+?)\s+(?:כ|ל)\s*(?:חתום|לא חתום|בעבודה)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return extractEntriesFromText(match[1]);
    }
  }

  return [];
}

function upsertOne(name: string, status: ArtistStatus, note?: string): AiCommand {
  return {
    action: "upsert_by_names",
    entries: [{ name, note }],
    status,
    createMissing: true,
  };
}

/** Single-line natural Hebrew commands — no AI needed. */
export function parseSingleLineCommand(text: string): AiCommand | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const markMatch = trimmed.match(
    /(?:סמן|שנה|העבר)\s+(?:את\s+)?(.+?)\s+(?:כ|ל)\s*(חתום|לא\s*חתום|בעבודה)/i,
  );
  if (markMatch) {
    const name = cleanName(markMatch[1]);
    const status = parseStatus(markMatch[2]) ?? parseStatus(trimmed);
    if (name && status) return upsertOne(name, status);
  }

  const prefixMatch = trimmed.match(
    /^(?:הוסף|צור|להוסיף|הוספת)\s+(?:אומן\s+)?(?:חדש\s+)?(?:בשם\s+)?(.+)$/i,
  );
  if (prefixMatch) {
    const name = cleanName(prefixMatch[1]);
    const status = parseStatus(trimmed) ?? "in_process";
    if (name) return upsertOne(name, status);
  }

  const suffixAddMatch = trimmed.match(
    /^(.+?)\s+(?:ל)?הוס(?:יף|יפה|פה)\s+(?:אומן\s+)?(?:חדש\s+)?(?:במצב\s+)?(.*)$/i,
  );
  if (suffixAddMatch) {
    const name = cleanName(suffixAddMatch[1]);
    const status =
      parseStatus(suffixAddMatch[2]) || parseStatus(trimmed) || "in_process";
    if (name) return upsertOne(name, status);
  }

  const nameStatusMatch = trimmed.match(
    /^(.+?)\s+[-–—]?\s*(?:במצב\s+)?(חתום|לא\s*חתום|בעבודה)\s*$/i,
  );
  if (nameStatusMatch && !/^(כל|אומנים|רשימה)/i.test(nameStatusMatch[1])) {
    const name = cleanName(nameStatusMatch[1]);
    const status = parseStatus(nameStatusMatch[2]);
    if (name && status) return upsertOne(name, status);
  }

  return null;
}

export const LOCAL_COMMAND_HELP = `לא הבנתי את הפקודה. דוגמאות:
• משה לוק להוסיף אומן במצב בעבודה
• סמן את דני כהן כחתום
• סמן כחתום + רשימה (שורה לכל שם, עם מספרים)`;

/**
 * Fast local parser for Hebrew CRM commands — no Gemini required.
 */
export function parseLocalHebrewCommand(command: string): AiCommand | null {
  const text = command.trim();
  if (text.length < 2) return null;

  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const actionText = lines.join(" ");

  if (lines.length === 1) {
    const single = parseSingleLineCommand(text);
    if (single) return single;
  }

  const createMatch = text.match(
    /צור\s+(?:אומן\s+)?(?:חדש\s+)?(?:בשם\s+)?["']?([^"'\n]+?)["']?(?:\s|$)/i,
  );
  if (createMatch) {
    const name = cleanName(createMatch[1]);
    if (name) {
      return {
        action: "create_artist",
        name,
        status: parseStatus(actionText) ?? "in_process",
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

  let entries =
    lines.length > 1 ? extractEntriesFromText(text) : extractNamesFromSingleLine(text);

  if (entries.length === 0 && isMostlyNameList(lines)) {
    entries = extractEntriesFromText(text);
  }

  const status = parseStatus(actionText);
  const odooApprove = /אשר\s*odoo/i.test(actionText);
  const odooRevoke = /בטל\s*odoo/i.test(actionText);

  if (entries.length > 0) {
    const defaultStatus: ArtistStatus = status ?? "in_process";

    return {
      action: "upsert_by_names",
      entries,
      status: status ?? defaultStatus,
      handlerName: handlerMatch?.[1]?.trim(),
      isOdooApproved: odooApprove ? true : odooRevoke ? false : undefined,
      createMissing: true,
    };
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
