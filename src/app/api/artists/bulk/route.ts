import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { broadcastArtistsChanged } from "@/lib/artists-events";
import { bulkUpdateArtists } from "@/lib/artists";
import { requireAccess } from "@/lib/access/require-access";
import { runMigrations } from "@/lib/db/migrate";

const bulkSchema = z
  .object({
    ids: z.array(z.string().min(1)).min(1),
    handlerName: z.string().trim().min(1).optional(),
    status: z.enum(["signed", "unsigned", "in_process"]).optional(),
    isOdooApproved: z.boolean().optional(),
    songCount: z.number().int().min(0).optional(),
  })
  .refine(
    (body) =>
      body.handlerName !== undefined ||
      body.status !== undefined ||
      body.isOdooApproved !== undefined ||
      body.songCount !== undefined,
    { message: "חובה לציין לפחות שדה אחד לעדכון" },
  );

export async function PATCH(request: NextRequest) {
  try {
    const access = await requireAccess();
    if (!access.ok) return access.response;
    await runMigrations();
    const body = bulkSchema.parse(await request.json());
    const artists = await bulkUpdateArtists(body.ids, {
      handlerName: body.handlerName,
      status: body.status,
      isOdooApproved: body.isOdooApproved,
      songCount: body.songCount,
    });
    broadcastArtistsChanged();
    if (artists.length > 25) {
      return NextResponse.json({ count: artists.length, ok: true });
    }
    return NextResponse.json({ artists, count: artists.length });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "שגיאה בעדכון מרובה";
    console.error("bulk update failed:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
