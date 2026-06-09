import postgres from "postgres";

const url = process.env.ARTIST_DATABASE_URL || process.env.DATABASE_URL;
if (!url) {
  console.log("migrate-all: no DATABASE_URL — skipping");
  process.exit(0);
}

const isLocal = /localhost|127\.0\.0\.1/.test(url);
if (isLocal) {
  console.log("migrate-all: localhost URL — skipping (set Neon URL in production)");
  process.exit(0);
}

const sql = postgres(url, { ssl: "require", max: 1 });

try {
  console.log("migrate-all: song_count…");
  await sql`
    ALTER TABLE artists
    ADD COLUMN IF NOT EXISTS song_count INTEGER NOT NULL DEFAULT 0
  `;

  console.log("migrate-all: is_odoo_approved…");
  await sql`
    ALTER TABLE artists
    ADD COLUMN IF NOT EXISTS is_odoo_approved BOOLEAN NOT NULL DEFAULT false
  `;

  console.log("migrate-all: legacy fields…");
  await sql`
    ALTER TABLE artists ADD COLUMN IF NOT EXISTS email TEXT;
    ALTER TABLE artists ADD COLUMN IF NOT EXISTS notes TEXT;
    ALTER TABLE artists ADD COLUMN IF NOT EXISTS tag TEXT;
    ALTER TABLE artists ADD COLUMN IF NOT EXISTS folder_id TEXT;
    ALTER TABLE artists ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
  `;
  await sql`
    CREATE TABLE IF NOT EXISTS folders (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  console.log("migrate-all: stuck → in_process…");
  const stuck = await sql`
    UPDATE artists SET status = 'in_process', updated_at = NOW()
    WHERE status = 'stuck'
    RETURNING id
  `;
  if (stuck.length > 0) {
    console.log(`migrate-all: migrated ${stuck.length} stuck artists`);
  }

  const [{ count }] = await sql`
    SELECT COUNT(*)::int AS count FROM artists WHERE deleted_at IS NULL
  `;
  console.log(`migrate-all: complete — ${count} active artists`);
} catch (error) {
  console.error("migrate-all failed:", error);
  process.exit(1);
} finally {
  await sql.end();
}
