import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { broadcastArtistsChanged } from "@/lib/artists-events";
import {
  createArtist,
  DuplicateArtistError,
  getArtistStats,
  listArtists,
  type ArtistsScope,
} from "@/lib/artists";
import { requireAccess } from "@/lib/access/require-access";

const scopeValues = ["board", "vault", "all"] as const;

export async function GET(request: NextRequest) {
  try {
    const access = await requireAccess();
    if (!access.ok) return access.response;

    const q = request.nextUrl.searchParams.get("q") ?? undefined;
    const scopeParam = request.nextUrl.searchParams.get("scope") ?? "board";
    const scope: ArtistsScope = scopeValues.includes(scopeParam as ArtistsScope)
      ? (scopeParam as ArtistsScope)
      : "board";

    const [artists, stats] = await Promise.all([
      listArtists(q, false, q ? "all" : scope),
      getArtistStats(),
    ]);

    return NextResponse.json({ artists, stats, scope: q ? "search" : scope });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "שגיאה בטעינת אומנים" }, { status: 500 });
  }
}

const createSchema = z.object({
  name: z.string().trim().min(1, "שם אומן נדרש"),
  status: z.enum(["signed", "unsigned", "in_process"]).optional(),
  handlerName: z.string().trim().min(1).optional(),
  isOdooApproved: z.boolean().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const access = await requireAccess();
    if (!access.ok) return access.response;
    const body = createSchema.parse(await request.json());
    const artist = await createArtist(body);
    broadcastArtistsChanged();
    return NextResponse.json({ artist }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message }, { status: 400 });
    }
    if (error instanceof DuplicateArtistError) {
      return NextResponse.json(
        { error: error.message, existing: error.existing },
        { status: 409 },
      );
    }
    console.error(error);
    return NextResponse.json({ error: "שגיאה ביצירת אומן" }, { status: 500 });
  }
}
