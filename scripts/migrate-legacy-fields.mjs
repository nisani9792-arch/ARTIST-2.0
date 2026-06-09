import postgres from "postgres";

const url = process.env.ARTIST_DATABASE_URL || process.env.DATABASE_URL;
if (!url) {
  console.error("Missing DATABASE_URL");
  process.exit(1);
}

const sql = postgres(url, { max: 1 });

try {
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
  console.log("Legacy fields + folders table ready");
} finally {
  await sql.end();
}
