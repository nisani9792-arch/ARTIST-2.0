import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { LOCAL_COMMAND_HELP, parseLocalHebrewCommand } from "@/lib/ai-command-parser";
import { broadcastArtistsChanged } from "@/lib/artists-events";
import {
  bulkUpdateArtists,
  createArtist,
  getArtistStats,
  listHandlers,
  markOdooByFilter,
  markSignedByFilter,
  reassignHandlerByFilter,
  upsertArtistsByNames,
} from "@/lib/artists";
import type { ArtistStatus } from "@/lib/types";
import { type AiCommand, commandSchema, isGeminiConfigured, parseHebrewCommand } from "@/lib/gemini";
import { STATUS_META } from "@/lib/types";
import { requireAccess } from "@/lib/access/require-access";

const bodySchema = z.object({
  command: z.string().trim().min(2),
});

const USE_GEMINI_FALLBACK = process.env.AI_USE_GEMINI === "true";

function friendlyAiError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error);
  if (/429|quota|Too Many Requests/i.test(raw)) {
    return "מכסת Gemini מלאה — השתמש בפורמטים המקומיים (למשל: משה לוק להוסיף אומן במצב בעבודה).";
  }
  if (/GoogleGenerativeAI/i.test(raw)) {
    return "שירות AI לא זמין כרגע — נסה פקודה בפורמט המקומי.";
  }
  return raw || "לא הצלחתי לפרש את הפקודה";
}

function formatUpsertMessage(
  result: { updated: number; created: number; total: number },
  status?: ArtistStatus,
): { affected: number; message: string } {
  const parts: string[] = [];
  if (result.updated > 0) parts.push(`עודכנו ${result.updated}`);
  if (result.created > 0) parts.push(`נוצרו ${result.created}`);
  const statusPart = status ? ` — ${STATUS_META[status].label}` : "";
  return {
    affected: result.total,
    message: `${parts.join(", ")}${statusPart}`,
  };
}

async function executeCommand(parsed: AiCommand): Promise<{ affected: number; message: string }> {
  switch (parsed.action) {
    case "reassign_handler": {
      const affected = await reassignHandlerByFilter({
        fromHandler: parsed.fromHandler,
        toHandler: parsed.toHandler,
        status: parsed.filter?.status,
      });
      return { affected, message: `עודכנו ${affected} אומנים — מטפל חדש: ${parsed.toHandler}` };
    }
    case "mark_status": {
      const affected = await markSignedByFilter({
        status: parsed.status,
        handlerName: parsed.filter?.handlerName,
        fromStatus: parsed.filter?.fromStatus,
      });
      return {
        affected,
        message: `עודכנו ${affected} אומנים — סטטוס: ${STATUS_META[parsed.status].label}`,
      };
    }
    case "bulk_handler": {
      await bulkUpdateArtists(parsed.ids, { handlerName: parsed.handlerName });
      return { affected: parsed.ids.length, message: `עודכנו ${parsed.ids.length} אומנים — מטפל: ${parsed.handlerName}` };
    }
    case "create_artist": {
      const artist = await createArtist({
        name: parsed.name,
        status: parsed.status,
        handlerName: parsed.handlerName,
        isOdooApproved: parsed.isOdooApproved,
      });
      return { affected: 1, message: `נוצר אומן: ${artist.name}` };
    }
    case "update_by_names": {
      const result = await upsertArtistsByNames({
        entries: parsed.names.map((name) => ({ name })),
        status: parsed.status,
        handlerName: parsed.handlerName,
        isOdooApproved: parsed.isOdooApproved,
        createMissing: true,
      });
      if (result.total === 0) {
        throw new Error(
          `לא נמצאו אומנים תואמים לשמות: ${parsed.names.slice(0, 5).join(", ")}${parsed.names.length > 5 ? "…" : ""}`,
        );
      }
      return formatUpsertMessage(result, parsed.status);
    }
    case "upsert_by_names": {
      const result = await upsertArtistsByNames({
        entries: parsed.entries,
        status: parsed.status,
        handlerName: parsed.handlerName,
        isOdooApproved: parsed.isOdooApproved,
        createMissing: parsed.createMissing ?? true,
      });
      if (result.total === 0) {
        throw new Error("לא בוצעו פעולות — בדוק את רשימת השמות");
      }
      return formatUpsertMessage(result, parsed.status);
    }
    case "bulk_odoo": {
      const affected = await markOdooByFilter({
        isOdooApproved: parsed.isOdooApproved,
        status: parsed.filter?.status,
        handlerName: parsed.filter?.handlerName,
      });
      return {
        affected,
        message: `עודכנו ${affected} אומנים — Odoo ${parsed.isOdooApproved ? "אושר" : "בוטל"}`,
      };
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    const access = await requireAccess();
    if (!access.ok) return access.response;

    const { command } = bodySchema.parse(await request.json());

    let source: "local" | "gemini" = "local";
    let parsed: AiCommand | null = parseLocalHebrewCommand(command);

    if (!parsed) {
      if (USE_GEMINI_FALLBACK && isGeminiConfigured()) {
        source = "gemini";
        try {
          const [handlers, stats] = await Promise.all([listHandlers(), getArtistStats()]);
          parsed = await parseHebrewCommand(command, {
            handlers,
            unsignedCount: stats.unsigned,
            signedCount: stats.signed,
            inProcessCount: stats.in_process,
          });
        } catch (geminiError) {
          return NextResponse.json({ error: friendlyAiError(geminiError) }, { status: 429 });
        }
      } else {
        return NextResponse.json({ error: LOCAL_COMMAND_HELP }, { status: 400 });
      }
    } else {
      commandSchema.parse(parsed);
    }

    const { affected, message } = await executeCommand(parsed);
    if (affected > 0) broadcastArtistsChanged();

    return NextResponse.json({ ok: true, affected, message, action: parsed.action, source });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message }, { status: 400 });
    }
    const message = friendlyAiError(error);
    console.error("ai command failed:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
