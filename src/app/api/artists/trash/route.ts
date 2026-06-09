import { NextResponse } from "next/server";
import { listTrashArtists } from "@/lib/artists";
import { requireAccess } from "@/lib/access/require-access";

export async function GET() {
  try {
    const access = await requireAccess();
    if (!access.ok) return access.response;
    const artists = await listTrashArtists();
    return NextResponse.json({ artists });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "שגיאה בטעינת סל מחזור" }, { status: 500 });
  }
}
