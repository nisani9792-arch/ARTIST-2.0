import "dotenv/config";
import postgres from "postgres";

const url = process.env.ARTIST_DATABASE_URL || process.env.DATABASE_URL;
if (!url || url.includes("localhost")) {
  console.error("DATABASE_URL missing or localhost — set ARTIST_DATABASE_URL or DATABASE_URL");
  process.exit(1);
}

const sql = postgres(url, { ssl: "require", max: 1 });

const rows = await sql`
  UPDATE artists SET status = 'in_process', updated_at = NOW()
  WHERE status = 'stuck'
  RETURNING id
`;

console.log(`Migrated ${rows.length} artists: stuck → in_process`);
await sql.end();
