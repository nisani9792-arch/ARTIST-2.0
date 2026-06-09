import { GoogleGenerativeAI } from "@google/generative-ai";
import { z } from "zod";
import type { Artist, ArtistStatus } from "./types";

const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-2.0-flash";

const geminiApiKey = () =>
  String(process.env.GEMINI_API_KEY || process.env.GOOGLE_GEMINI_API_KEY || "").trim();

export const isGeminiConfigured = () => geminiApiKey().length > 10;

const extractJsonBlock = (value: string) => {
  const trimmed = value.trim();
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) return trimmed;
  const first = trimmed.indexOf("{");
  const last = trimmed.lastIndexOf("}");
  if (first === -1 || last === -1 || last <= first) {
    throw new Error("Gemini response does not include JSON block");
  }
  return trimmed.slice(first, last + 1);
};

const getModel = (systemInstruction: string) => {
  const apiKey = geminiApiKey();
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({
    model: MODEL_NAME,
    systemInstruction,
    generationConfig: {
      temperature: 0.2,
      responseMimeType: "application/json",
    },
  });
};

const suggestionsSchema = z.object({
  stuckIds: z.array(z.string()),
  reason: z.string().optional(),
});

export async function analyzeStuckArtists(artists: Artist[]): Promise<string[]> {
  if (!isGeminiConfigured() || artists.length === 0) return [];

  const payload = artists.slice(0, 200).map((a) => ({
    id: a.id,
    name: a.name,
    status: a.status,
    handlerName: a.handlerName,
    lastActionTimestamp: a.lastActionTimestamp,
  }));

  const model = getModel(
    `אתה עוזר CRM לניהול אומנים. נתח אילו אומנים "בעבודה" או מוזנחים לפי תאריך פעולה אחרונה.
החזר JSON בלבד: {"stuckIds":["uuid",...],"reason":"..."}`,
  );

  const result = await model.generateContent(JSON.stringify(payload));
  const text = result.response.text();
  const parsed = suggestionsSchema.parse(JSON.parse(extractJsonBlock(text)));
  return parsed.stuckIds;
}

const statusEnum = z.enum(["signed", "unsigned", "in_process"]);

export const commandSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("reassign_handler"),
    fromHandler: z.string().optional(),
    toHandler: z.string(),
    filter: z.object({ status: statusEnum.optional() }).optional(),
  }),
  z.object({
    action: z.literal("mark_status"),
    status: statusEnum,
    filter: z
      .object({
        handlerName: z.string().optional(),
        fromStatus: statusEnum.optional(),
      })
      .optional(),
  }),
  z.object({
    action: z.literal("bulk_handler"),
    ids: z.array(z.string()),
    handlerName: z.string(),
  }),
  z.object({
    action: z.literal("create_artist"),
    name: z.string().min(1),
    status: statusEnum.optional(),
    handlerName: z.string().optional(),
    isOdooApproved: z.boolean().optional(),
  }),
  z.object({
    action: z.literal("update_by_names"),
    names: z.array(z.string().min(1)).min(1),
    status: statusEnum.optional(),
    handlerName: z.string().optional(),
    isOdooApproved: z.boolean().optional(),
  }),
  z.object({
    action: z.literal("bulk_odoo"),
    isOdooApproved: z.boolean(),
    filter: z
      .object({
        status: statusEnum.optional(),
        handlerName: z.string().optional(),
      })
      .optional(),
  }),
]);

export type AiCommand = z.infer<typeof commandSchema>;

export async function parseHebrewCommand(
  command: string,
  context: {
    handlers: string[];
    unsignedCount: number;
    signedCount: number;
    inProcessCount: number;
    sampleNames?: string[];
  },
): Promise<AiCommand> {
  const model = getModel(
    `אתה מפרש פקודות CRM בעברית לפעולות מובנות. החזר JSON בלבד עם אחד מהמבנים:
1) {"action":"reassign_handler","fromHandler":"יוסי","toHandler":"דוד","filter":{"status":"unsigned"}}
2) {"action":"mark_status","status":"signed","filter":{"handlerName":"יוסי","fromStatus":"unsigned"}}
3) {"action":"bulk_handler","ids":["uuid"],"handlerName":"דוד"}
4) {"action":"create_artist","name":"שם האומן","status":"unsigned","handlerName":"מטפל","isOdooApproved":false}
5) {"action":"update_by_names","names":["אבי רוקובסקי","שם נוסף"],"status":"signed","isOdooApproved":true}
6) {"action":"bulk_odoo","isOdooApproved":true,"filter":{"status":"signed"}}

דוגמאות:
- "צור אומן חדש בשם דני כהן" → create_artist
- "סמן את אבי רוקובסקי כחתום" → update_by_names עם status signed
- "העבר את כל הלא חתומים של יוסי לחתום" → mark_status
- "אשר Odoo לכל החתומים" → bulk_odoo עם isOdooApproved true
- "שנה מטפל של כל הלא חתומים לדוד" → reassign_handler

סטטוסים: signed=חתום, unsigned=לא חתום, in_process=בעבודה`,
  );

  const result = await model.generateContent(JSON.stringify({ command, context }));
  const text = result.response.text();
  const raw = JSON.parse(extractJsonBlock(text));
  return commandSchema.parse(raw);
}
