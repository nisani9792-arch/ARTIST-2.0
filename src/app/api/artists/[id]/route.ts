import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { broadcastArtistsChanged } from "@/lib/artists-events";
import { normalizeArtistId } from "@/lib/artist-id";
import { softDeleteArtist, updateArtist } from "@/lib/artists";
import { requireAccess } from "@/lib/access/require-access";
import { runMigrations } from "@/lib/db/migrate";

const patchSchema = z.object({
  name: z.string().trim().min(1).optional(),
  status: z.enum(["signed", "unsigned", "in_process"]).optional(),
  isOdooApproved: z.boolean().optional(),
  songCount: z.number().int().min(0).optional(),
  handlerName: z.string().trim().min(1).optional(),
  email: z.string().optional(),
  notes: z.string().optional(),
  tag: z.string().optional(),
  folderId: z.string().nullable().optional(),
  deletedAt: z.string().nullable().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const access = await requireAccess();
    if (!access.ok) return access.response;
    await runMigrations();
    const { id: rawId } = await params;
    const id = normalizeArtistId(rawId);
    const body = patchSchema.parse(await request.json());
    const artist = await updateArtist(id, body);

    if (!artist) {
      return NextResponse.json({ error: "אומן לא נמצא" }, { status: 404 });
    }

    broadcastArtistsChanged();
    return NextResponse.json({ artist });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: "שגיאה בעדכון אומן" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const access = await requireAccess();
    if (!access.ok) return access.response;
    await runMigrations();
    const { id: rawId } = await params;
    const artist = await softDeleteArtist(normalizeArtistId(rawId));
    if (!artist) {
      return NextResponse.json({ error: "אומן לא נמצא" }, { status: 404 });
    }
    broadcastArtistsChanged();
    return NextResponse.json({ artist });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "שגיאה במחיקה" }, { status: 500 });
  }
}
