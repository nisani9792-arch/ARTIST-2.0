import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { mergeDuplicateArtists } from "@/lib/artist-duplicates";
import { broadcastArtistsChanged } from "@/lib/artists-events";
import { requireAccess } from "@/lib/access/require-access";

const bodySchema = z.object({
  keepId: z.string().min(1),
  removeIds: z.array(z.string().min(1)).min(1),
});

export async function POST(request: NextRequest) {
  try {
    const access = await requireAccess();
    if (!access.ok) return access.response;

    const body = bodySchema.parse(await request.json());
    const result = await mergeDuplicateArtists(body.keepId, body.removeIds);
    broadcastArtistsChanged();

    return NextResponse.json({
      ok: true,
      artistId: result.artistId,
      merged: result.merged,
      message: `מוזגו ${result.merged} כפילויות`,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "שגיאה במיזוג";
    console.error("merge failed:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
