import { NextRequest, NextResponse } from "next/server";
import { listArtists } from "@/lib/artists";
import { STATUS_META } from "@/lib/types";
import { requireAccess } from "@/lib/access/require-access";

export async function GET(request: NextRequest) {
  try {
    const access = await requireAccess();
    if (!access.ok) return access.response;

    const scope = request.nextUrl.searchParams.get("scope") ?? "all";
    const idsParam = request.nextUrl.searchParams.get("ids");
    const q = request.nextUrl.searchParams.get("q") ?? undefined;

    let artists = await listArtists(q);

    if (scope === "selected" && idsParam) {
      const ids = new Set(idsParam.split(",").filter(Boolean));
      artists = artists.filter((a) => ids.has(a.id));
    }

    const header = ["שם", "סטטוס", "מטפל", "תגית", "אימייל", "Odoo", "שירים", "הערות"];
    const rows = artists.map((a) =>
      [
        a.name,
        STATUS_META[a.status].label,
        a.handlerName,
        a.tag,
        a.email,
        a.isOdooApproved ? "כן" : "לא",
        String(a.songCount),
        a.notes.replace(/\n/g, " "),
      ]
        .map((v) => `"${String(v).replace(/"/g, '""')}"`)
        .join(","),
    );

    const csv = "\uFEFF" + [header.join(","), ...rows].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="artists-export.csv"`,
      },
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "שגיאה בייצוא" }, { status: 500 });
  }
}
