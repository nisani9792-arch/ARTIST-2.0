import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createArtist, listArtists } from "@/lib/artists";

export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams.get("q") ?? undefined;
    const artists = await listArtists(q);
    return NextResponse.json({ artists });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "שגיאה בטעינת אומנים" }, { status: 500 });
  }
}

const createSchema = z.object({
  name: z.string().trim().min(1, "שם אומן נדרש"),
});

export async function POST(request: NextRequest) {
  try {
    const body = createSchema.parse(await request.json());
    const artist = await createArtist(body.name);
    return NextResponse.json({ artist }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: "שגיאה ביצירת אומן" }, { status: 500 });
  }
}
