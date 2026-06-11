import { NextResponse } from "next/server";
import { findDuplicateGroups } from "@/lib/artist-duplicates";
import { requireAccess } from "@/lib/access/require-access";

export async function GET() {
  try {
    const access = await requireAccess();
    if (!access.ok) return access.response;

    const groups = await findDuplicateGroups();
    const duplicateCount = groups.reduce((sum, g) => sum + g.artists.length - 1, 0);

    return NextResponse.json({
      groups,
      groupCount: groups.length,
      duplicateCount,
    });
  } catch (error) {
    console.error("duplicates scan failed:", error);
    return NextResponse.json({ error: "שגיאה בסריקת כפילויות" }, { status: 500 });
  }
}
