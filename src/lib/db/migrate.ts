import { sql } from "drizzle-orm";
import { db, getSql } from "@/lib/db";

let migrated = false;

export async function runMigrations(): Promise<void> {
  if (migrated) return;
  if (process.env.SKIP_DB_MIGRATE === "true") {
    migrated = true;
    return;
  }

  const url = process.env.ARTIST_DATABASE_URL || process.env.DATABASE_URL || "";
  if (!url || /localhost|127\.0\.0\.1/.test(url)) {
    migrated = true;
    return;
  }

  console.log("db:migrate — applying schema updates…");

  await db.execute(sql`
    ALTER TABLE artists ADD COLUMN IF NOT EXISTS song_count INTEGER NOT NULL DEFAULT 0
  `);
  await db.execute(sql`
    ALTER TABLE artists ADD COLUMN IF NOT EXISTS is_odoo_approved BOOLEAN NOT NULL DEFAULT false
  `);
  await db.execute(sql`
    ALTER TABLE artists ADD COLUMN IF NOT EXISTS email TEXT
  `);
  await db.execute(sql`
    ALTER TABLE artists ADD COLUMN IF NOT EXISTS notes TEXT
  `);
  await db.execute(sql`
    ALTER TABLE artists ADD COLUMN IF NOT EXISTS tag TEXT
  `);
  await db.execute(sql`
    ALTER TABLE artists ADD COLUMN IF NOT EXISTS folder_id TEXT
  `);
  await db.execute(sql`
    ALTER TABLE artists ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ
  `);
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS folders (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
  await db.execute(sql`
    UPDATE artists SET status = 'in_process', updated_at = NOW()
    WHERE status IN ('stuck', 'failed')
  `);
  await db.execute(sql`
    UPDATE artists SET status = 'unsigned', updated_at = NOW()
    WHERE status IN ('none', 'rejected', '') OR status IS NULL
  `);
  await db.execute(sql`
    UPDATE artists SET status = 'unsigned', updated_at = NOW()
    WHERE status NOT IN ('signed', 'unsigned', 'in_process')
  `);
  await db.execute(sql`
    ALTER TABLE artists DROP CONSTRAINT IF EXISTS artists_status_check
  `);
  await db.execute(sql`
    ALTER TABLE artists ADD CONSTRAINT artists_status_check
    CHECK (status IN ('signed', 'unsigned', 'in_process'))
  `);
  await db.execute(sql`
    UPDATE artists SET notes = '' WHERE notes IS NULL
  `);
  await db.execute(sql`
    UPDATE artists SET email = '' WHERE email IS NULL
  `);
  await db.execute(sql`
    UPDATE artists SET tag = '' WHERE tag IS NULL
  `);

  migrated = true;
  console.log("db:migrate — complete");
}

export async function closeMigrationPool(): Promise<void> {
  try {
    const client = getSql();
    await client.end({ timeout: 5 });
  } catch {
    /* ignore */
  }
}
