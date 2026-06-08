import postgres from "postgres";

const url = process.env.ARTIST_DATABASE_URL || process.env.DATABASE_URL;
if (!url) {
  console.error("Missing DATABASE_URL or ARTIST_DATABASE_URL");
  process.exit(1);
}

const sql = postgres(url, { max: 1 });

try {
  await sql`
    ALTER TABLE artists
    ADD COLUMN IF NOT EXISTS song_count INTEGER NOT NULL DEFAULT 0
  `;
  const [{ count }] = await sql`SELECT COUNT(*)::int AS count FROM artists`;
  console.log(`song_count column ready. artists: ${count}`);
} finally {
  await sql.end();
}
