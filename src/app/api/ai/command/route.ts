import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  bulkUpdateArtists,
  listArtists,
  markSignedByFilter,
  reassignHandlerByFilter,
} from "@/lib/artists";
import { isGeminiConfigured, parseHebrewCommand } from "@/lib/gemini";

const bodySchema = z.object({
  command: z.string().trim().min(2),
});

export async function POST(request: NextRequest) {
  try {
    if (!isGeminiConfigured()) {
      return NextResponse.json({ error: "Gemini לא מוגדר" }, { status: 503 });
    }

    const { command } = bodySchema.parse(await request.json());
    const artists = await listArtists();
    const handlers = [...new Set(artists.map((a) => a.handlerName))];
    const unsignedCount = artists.filter((a) => !a.isSigned).length;
    const signedCount = artists.filter((a) => a.isSigned).length;

    const parsed = await parseHebrewCommand(command, {
      handlers,
      unsignedCount,
      signedCount,
    });

    let affected = 0;
    let message = "";

    switch (parsed.action) {
      case "reassign_handler":
        affected = await reassignHandlerByFilter({
          fromHandler: parsed.fromHandler,
          toHandler: parsed.toHandler,
          isSigned: parsed.filter?.isSigned,
        });
        message = `עודכנו ${affected} אומנים — מטפל חדש: ${parsed.toHandler}`;
        break;
      case "mark_signed":
        affected = await markSignedByFilter({
          isSigned: parsed.isSigned,
          handlerName: parsed.filter?.handlerName,
          fromSigned: parsed.filter?.fromSigned,
        });
        message = `עודכנו ${affected} אומנים — סטטוס: ${parsed.isSigned ? "חתום" : "לא חתום"}`;
        break;
      case "bulk_handler":
        await bulkUpdateArtists(parsed.ids, { handlerName: parsed.handlerName });
        affected = parsed.ids.length;
        message = `עודכנו ${affected} אומנים — מטפל: ${parsed.handlerName}`;
        break;
    }

    return NextResponse.json({ ok: true, affected, message, action: parsed.action });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: "לא הצלחתי לפרש את הפקודה" }, { status: 500 });
  }
}
