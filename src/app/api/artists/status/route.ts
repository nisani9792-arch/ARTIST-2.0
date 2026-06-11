import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { broadcastArtistsChanged } from "@/lib/artists-events";
import { friendlyDbError, updateArtistsStatus } from "@/lib/artists";
import { requireAccess } from "@/lib/access/require-access";

const statusSchema = z.object({
  ids: z.array(z.string().min(1)).min(1, "חובה לציין לפחות אומן אחד"),
  status: z.enum(["signed", "unsigned", "in_process"]),
});

/** Dedicated status updates — ids in JSON body (safe for Hebrew slug ids). */
export async function POST(request: NextRequest) {
  try {
    const access = await requireAccess();
    if (!access.ok) return access.response;

    const body = statusSchema.parse(await request.json());
    const result = await updateArtistsStatus(body.ids, body.status);

    broadcastArtistsChanged();

    return NextResponse.json({
      ok: true,
      count: result.count,
      artists: result.artists.length <= 25 ? result.artists : undefined,
      missingIds: result.missingIds.length > 0 ? result.missingIds : undefined,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message }, { status: 400 });
    }
    const message = friendlyDbError(error);
    console.error("status update failed:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
