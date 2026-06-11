import type { AiCommand } from "./gemini";
import type { ArtistStatus } from "./types";

export type ParsedNameEntry = {
  name: string;
  note?: string;
};

const INSTRUCTION_LINE_RE =
  /^(?:סמן|שנה|העבר|צור|הוסף|להוסיף|הוספת|להכניס|תעביר|העברי|שים|הכנס|אשר|בטל|רשימה|להלן|הבאים|כל\s|אומנים|מטפל|גורם|odoo|חתום|חתומים|לא\s*חתום|בעבודה|ממתין)/i;

const INSTRUCTION_RE =
  /^(סמן|שנה|העבר|צור|הוסף|להוסיף|אשר|בטל|רשימה|להלן|הבאים|כל|אומנים|מטפל|גורם|odoo|חתום|חתומים|לא חתום|בעבודה)/i;

const NUMBERED_LINE_RE = /^\d+[\.\)]\s*.+/;

/** חתומים uses medial mem (מ); חתום uses final mem (ם) — both must match. */
const SIGNED_STATUS_RE = /חתומים|כחתום|חתום/i;
const UNSIGNED_STATUS_RE = /לא\s*חתומים|לא\s*חתום/i;

function parseStatus(text: string): ArtistStatus | undefined {
  if (UNSIGNED_STATUS_RE.test(text)) return "unsigned";
  if (/בעבודה|בתהליך/i.test(text)) return "in_process";
  if (SIGNED_STATUS_RE.test(text)) return "signed";
  return undefined;
}

function isOdooPendingPhrase(text: string): boolean {
  return /ממתין\s*(לאישור\s*)?(ב)?אודו/i.test(text);
}

function cleanName(raw: string): string {
  return raw
    .replace(/^[-•*·]\s*/, "")
    .replace(/^ו-?/, "")
    .replace(/["'״]/g, "")
    .replace(/\s*(?:במצב\s+)?(כחתום|כלא חתום|לבעבודה|כבעבודה|חתום|לא חתום|בעבודה)\s*$/i, "")
    .trim();
}

function isInstructionLine(line: string): boolean {
  const t = line.trim();
  if (!t) return true;
  if (INSTRUCTION_LINE_RE.test(t)) return true;
  if (/^(כחתום|כלא חתום|לבעבודה|סמן\s+כ)/i.test(t)) return true;
  if (/:\s*$/.test(t) && /(סמן|העבר|שנה|רשימה|הכנס|להכניס)/i.test(t)) return true;
  if (/(להכניס|הכנס).*(רשימה|חתומים?|ממתין)/i.test(t)) return true;
  if (isOdooPendingPhrase(t) && /(רשימה|חתומים?|הכנס|להכניס)/i.test(t)) return true;
  return false;
}

/** Remove leading instruction line(s) before name extraction. */
export function stripLeadingInstructionLines(text: string): {
  body: string;
  instruction: string;
} {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return { body: "", instruction: "" };

  const instructionLines: string[] = [];
  let i = 0;
  while (i < lines.length && isInstructionLine(lines[i]) && !NUMBERED_LINE_RE.test(lines[i])) {
    instructionLines.push(lines[i]);
    i += 1;
  }

  return {
    instruction: instructionLines.join(" "),
    body: lines.slice(i).join("\n"),
  };
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
  const { body } = stripLeadingInstructionLines(text);
  const source = body || text;
  const lines = source.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  const entries: ParsedNameEntry[] = [];

  for (const line of lines) {
    const entry = parseNameLine(line);
    if (entry) entries.push(entry);
  }

  if (entries.length === 0) {
    for (const part of source.split(/[,،、|]+/)) {
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
    /(?:סמן|שנה|העבר|תעביר|שים|הכנס)\s+(?:את\s+)?(.+?)\s+(?:כ|ל|ב)\s*(?:חתום|לא חתום|בעבודה)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match?.[1]) {
      return extractEntriesFromText(match[1]);
    }
  }

  return [];
}

function applySignedOdooDefault(
  status: ArtistStatus | undefined,
  isOdooApproved: boolean | undefined,
): boolean | undefined {
  if (status === "signed" && isOdooApproved === undefined) return false;
  return isOdooApproved;
}

function upsertOne(name: string, status: ArtistStatus, note?: string): AiCommand {
  return {
    action: "upsert_by_names",
    entries: [{ name, note }],
    status,
    isOdooApproved: applySignedOdooDefault(status, undefined),
    createMissing: true,
  };
}

/** Single-line natural Hebrew commands — no AI needed. */
export function parseSingleLineCommand(text: string): AiCommand | null {
  const trimmed = text.trim();
  if (!trimmed) return null;

  const markMatch = trimmed.match(
    /(?:סמן|שנה|העבר|תעביר|שים|הכנס)\s+(?:את\s+)?(.+?)\s+(?:כ|ל|ב)\s*(חתום|לא\s*חתום|בעבודה)/i,
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

export function describeCommandPreview(command: string): string | null {
  const parsed = parseLocalHebrewCommand(command);
  if (!parsed) return null;

  switch (parsed.action) {
    case "upsert_by_names":
      return `${parsed.entries.length} שמות → ${parsed.status ? STATUS_LABEL[parsed.status] : "בעבודה"}${
        parsed.isOdooApproved === false ? " (ללא Odoo)" : parsed.isOdooApproved ? " + Odoo" : ""
      }`;
    case "create_artist":
      return `יצירה: ${parsed.name}`;
    case "mark_status":
      return `עדכון סטטוס → ${STATUS_LABEL[parsed.status]}`;
    case "bulk_odoo":
      return parsed.isOdooApproved ? "אישור Odoo" : "ביטול Odoo";
    case "reassign_handler":
      return `שינוי מטפל → ${parsed.toHandler}`;
    default:
      return "פעולה מרובה";
  }
}

const STATUS_LABEL: Record<ArtistStatus, string> = {
  signed: "חתום",
  unsigned: "לא חתום",
  in_process: "בעבודה",
};

export const LOCAL_COMMAND_HELP = `לא הבנתי את הפקודה. דוגמאות:
• משה לוק להוסיף אומן במצב בעבודה
• סמן כחתום:
  1. משה לוק
  2. דני כהן
• סמן את דני כהן כחתום`;

/**
 * Fast local parser for Hebrew CRM commands — no Gemini required.
 */
export function parseLocalHebrewCommand(command: string): AiCommand | null {
  const text = command.trim();
  if (text.length < 2) return null;

  const rawLines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (rawLines.length === 1) {
    const single = parseSingleLineCommand(text);
    if (single) return single;
  }

  const { instruction, body } = stripLeadingInstructionLines(text);
  const actionText = [instruction, body].filter(Boolean).join(" ");
  const bodyLines = body.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);

  const createMatch = actionText.match(
    /צור\s+(?:אומן\s+)?(?:חדש\s+)?(?:בשם\s+)?["']?([^"'\n]+?)["']?(?:\s|$)/i,
  );
  if (createMatch) {
    const name = cleanName(createMatch[1]);
    if (name) {
      const status = parseStatus(actionText) ?? "in_process";
      return {
        action: "create_artist",
        name,
        status,
        isOdooApproved: /אשר\s*odoo/i.test(actionText) ? true : applySignedOdooDefault(status, undefined),
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
    bodyLines.length > 0
      ? extractEntriesFromText(body || text)
      : extractNamesFromSingleLine(actionText);

  if (entries.length === 0 && isMostlyNameList(bodyLines)) {
    entries = extractEntriesFromText(body);
  }

  const status = parseStatus(actionText);
  const odooApprove = /אשר\s*odoo/i.test(actionText);
  const odooRevoke = /בטל\s*odoo/i.test(actionText);
  const odooPending = isOdooPendingPhrase(actionText);

  if (entries.length > 0) {
    const resolvedStatus: ArtistStatus =
      status ?? (odooPending ? "signed" : "in_process");
    const isOdooApproved = odooApprove
      ? true
      : odooRevoke || odooPending
        ? false
        : applySignedOdooDefault(resolvedStatus, undefined);

    return {
      action: "upsert_by_names",
      entries,
      status: resolvedStatus,
      handlerName: handlerMatch?.[1]?.trim(),
      isOdooApproved,
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
