import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { bulkUpdateArtists } from "@/lib/artists";
import { requireAccess } from "@/lib/access/require-access";

const bulkSchema = z.object({
  ids: z.array(z.string().min(1)).min(1),
  handlerName: z.string().trim().min(1).optional(),
  status: z.enum(["signed", "unsigned", "in_process"]).optional(),
  isOdooApproved: z.boolean().optional(),
  songCount: z.number().int().min(0).optional(),
});

export async function PATCH(request: NextRequest) {
  try {
    const access = await requireAccess();
    if (!access.ok) return access.response;
    const body = bulkSchema.parse(await request.json());
    const artists = await bulkUpdateArtists(body.ids, {
      handlerName: body.handlerName,
      status: body.status,
      isOdooApproved: body.isOdooApproved,
      songCount: body.songCount,
    });
    return NextResponse.json({ artists, count: artists.length });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: "שגיאה בעדכון מרובה" }, { status: 500 });
  }
}
