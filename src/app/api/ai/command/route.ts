import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { broadcastArtistsChanged } from "@/lib/artists-events";
import {
  bulkUpdateArtists,
  createArtist,
  listArtists,
  markOdooByFilter,
  markSignedByFilter,
  reassignHandlerByFilter,
  updateArtistsByNames,
} from "@/lib/artists";
import { isGeminiConfigured, parseHebrewCommand } from "@/lib/gemini";
import { STATUS_META } from "@/lib/types";
import { requireAccess } from "@/lib/access/require-access";

const bodySchema = z.object({
  command: z.string().trim().min(2),
});

export async function POST(request: NextRequest) {
  try {
    const access = await requireAccess();
    if (!access.ok) return access.response;
    if (!isGeminiConfigured()) {
      return NextResponse.json({ error: "Gemini לא מוגדר" }, { status: 503 });
    }

    const { command } = bodySchema.parse(await request.json());
    const artists = await listArtists();
    const handlers = [...new Set(artists.map((a) => a.handlerName))];
    const unsignedCount = artists.filter((a) => a.status === "unsigned").length;
    const signedCount = artists.filter((a) => a.status === "signed").length;
    const inProcessCount = artists.filter((a) => a.status === "in_process").length;

    const parsed = await parseHebrewCommand(command, {
      handlers,
      unsignedCount,
      signedCount,
      inProcessCount,
      sampleNames: artists.slice(0, 30).map((a) => a.name),
    });

    let affected = 0;
    let message = "";

    switch (parsed.action) {
      case "reassign_handler":
        affected = await reassignHandlerByFilter({
          fromHandler: parsed.fromHandler,
          toHandler: parsed.toHandler,
          status: parsed.filter?.status,
        });
        message = `עודכנו ${affected} אומנים — מטפל חדש: ${parsed.toHandler}`;
        break;
      case "mark_status":
        affected = await markSignedByFilter({
          status: parsed.status,
          handlerName: parsed.filter?.handlerName,
          fromStatus: parsed.filter?.fromStatus,
        });
        message = `עודכנו ${affected} אומנים — סטטוס: ${STATUS_META[parsed.status].label}`;
        break;
      case "bulk_handler":
        await bulkUpdateArtists(parsed.ids, { handlerName: parsed.handlerName });
        affected = parsed.ids.length;
        message = `עודכנו ${affected} אומנים — מטפל: ${parsed.handlerName}`;
        break;
      case "create_artist": {
        const artist = await createArtist({
          name: parsed.name,
          status: parsed.status,
          handlerName: parsed.handlerName,
          isOdooApproved: parsed.isOdooApproved,
        });
        affected = 1;
        message = `נוצר אומן: ${artist.name}`;
        break;
      }
      case "update_by_names":
        affected = await updateArtistsByNames({
          names: parsed.names,
          status: parsed.status,
          handlerName: parsed.handlerName,
          isOdooApproved: parsed.isOdooApproved,
        });
        message = `עודכנו ${affected} אומנים לפי שם`;
        break;
      case "bulk_odoo":
        affected = await markOdooByFilter({
          isOdooApproved: parsed.isOdooApproved,
          status: parsed.filter?.status,
          handlerName: parsed.filter?.handlerName,
        });
        message = `עודכנו ${affected} אומנים — Odoo ${parsed.isOdooApproved ? "אושר" : "בוטל"}`;
        break;
    }

    if (affected > 0) broadcastArtistsChanged();
    return NextResponse.json({ ok: true, affected, message, action: parsed.action });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: "לא הצלחתי לפרש את הפקודה" }, { status: 500 });
  }
}
