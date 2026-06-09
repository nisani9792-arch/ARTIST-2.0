import { isNull, sql } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { runMigrations } from "@/lib/db/migrate";
import { artists } from "@/lib/db/schema";

const REQUIRED_COLUMNS = [
  "song_count",
  "is_odoo_approved",
  "deleted_at",
  "folder_id",
] as const;

export async function GET() {
  try {
    await runMigrations();
    await db.execute(sql`SELECT 1`);

    const columnRows = await db.execute<{ column_name: string }>(sql`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'artists'
    `);

    const found = new Set(
      (columnRows as unknown as { column_name: string }[]).map((r) => r.column_name),
    );
    const missing = REQUIRED_COLUMNS.filter((c) => !found.has(c));

    const [countRow] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(artists)
      .where(isNull(artists.deletedAt));

    const artistsCount = countRow?.count ?? 0;

    if (missing.length > 0) {
      return NextResponse.json(
        {
          ok: false,
          service: "artist-2.0",
          db: "connected",
          artistsCount,
          missingColumns: missing,
          error: "Schema migration required",
        },
        { status: 503 },
      );
    }

    return NextResponse.json({
      ok: true,
      service: "artist-2.0",
      db: "connected",
      artistsCount,
    });
  } catch (error) {
    console.error("health check failed:", error);
    return NextResponse.json(
      {
        ok: false,
        service: "artist-2.0",
        db: "error",
        error: error instanceof Error ? error.message : "Database unreachable",
      },
      { status: 503 },
    );
  }
}
