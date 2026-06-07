import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { updateArtist } from "@/lib/artists";

const patchSchema = z.object({
  name: z.string().trim().min(1).optional(),
  isSigned: z.boolean().optional(),
  isOdooApproved: z.boolean().optional(),
  handlerName: z.string().trim().min(1).optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params;
    const body = patchSchema.parse(await request.json());
    const artist = await updateArtist(id, body);

    if (!artist) {
      return NextResponse.json({ error: "אומן לא נמצא" }, { status: 404 });
    }

    return NextResponse.json({ artist });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: "שגיאה בעדכון אומן" }, { status: 500 });
  }
}
