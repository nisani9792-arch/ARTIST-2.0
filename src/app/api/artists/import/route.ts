import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { broadcastArtistsChanged } from "@/lib/artists-events";
import { importArtistsFromRows } from "@/lib/artists";
import { requireAccess } from "@/lib/access/require-access";

const rowSchema = z.object({
  name: z.string().trim().min(1),
  status: z.string().optional(),
  handler: z.string().optional(),
  email: z.string().optional(),
  tag: z.string().optional(),
});

const bodySchema = z.object({
  rows: z.array(rowSchema).min(1),
});

function parseCsv(text: string): z.infer<typeof rowSchema>[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const rows: z.infer<typeof rowSchema>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.replace(/^"|"$/g, "").trim());
    const name = cols[0];
    if (!name) continue;
    rows.push({
      name,
      status: cols[1],
      handler: cols[2],
      tag: cols[3],
      email: cols[4],
    });
  }
  return rows;
}

export async function POST(request: NextRequest) {
  try {
    const access = await requireAccess();
    if (!access.ok) return access.response;

    const contentType = request.headers.get("content-type") ?? "";
    let rows: z.infer<typeof rowSchema>[] = [];

    if (contentType.includes("text/csv") || contentType.includes("text/plain")) {
      const text = await request.text();
      rows = parseCsv(text);
    } else {
      const body = bodySchema.parse(await request.json());
      rows = body.rows;
    }

    const created = await importArtistsFromRows(rows);
    broadcastArtistsChanged();
    return NextResponse.json({ created, total: rows.length });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0]?.message }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: "שגיאה בייבוא" }, { status: 500 });
  }
}
