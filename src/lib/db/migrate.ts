import { sql } from "drizzle-orm";
import { db, getSql } from "@/lib/db";

let migrated = false;
let statusSchemaOk: boolean | null = null;

/** Normalize every row + rebuild artists status check constraint (idempotent). */
export async function fixArtistStatusConstraint(): Promise<void> {
  console.log("db:status — normalizing artist statuses…");

  await db.execute(sql`
    UPDATE artists SET status = CASE
      WHEN LOWER(TRIM(status)) IN ('signed') THEN 'signed'
      WHEN LOWER(TRIM(status)) IN (
        'in_process', 'stuck', 'failed', 'in-process', 'in process', 'inprogress'
      ) THEN 'in_process'
      ELSE 'unsigned'
    END,
    updated_at = NOW()
    WHERE status IS NULL
      OR LOWER(TRIM(status)) NOT IN ('signed', 'unsigned', 'in_process')
      OR status <> TRIM(status)
  `);

  await db.execute(sql`
    DO $$
    DECLARE r RECORD;
    BEGIN
      FOR r IN
        SELECT c.conname
        FROM pg_constraint c
        JOIN pg_class t ON c.conrelid = t.oid
        JOIN pg_namespace n ON t.relnamespace = n.oid
        WHERE n.nspname = 'public'
          AND t.relname = 'artists'
          AND c.contype = 'c'
      LOOP
        EXECUTE format('ALTER TABLE artists DROP CONSTRAINT %I', r.conname);
      END LOOP;
    END $$;
  `);

  await db.execute(sql`
    ALTER TABLE artists ADD CONSTRAINT artists_status_check
    CHECK (status IN ('signed', 'unsigned', 'in_process'))
  `);

  console.log("db:status — constraint rebuilt");
}

async function readStatusConstraintDefs(): Promise<string[]> {
  const rows = await db.execute<{ def: string }>(sql`
    SELECT pg_get_constraintdef(c.oid) AS def
    FROM pg_constraint c
    JOIN pg_class t ON c.conrelid = t.oid
    JOIN pg_namespace n ON t.relnamespace = n.oid
    WHERE n.nspname = 'public'
      AND t.relname = 'artists'
      AND c.contype = 'c'
  `);

  return (rows as unknown as { def: string }[]).map((r) => r.def ?? "");
}

function constraintAllowsInProcess(defs: string[]): boolean {
  if (defs.length === 0) return false;
  return defs.every(
    (def) => /in_process/i.test(def) && /signed/i.test(def) && /unsigned/i.test(def),
  );
}

/** Verify status constraint; repair on demand (safe to call before status writes). */
export async function ensureArtistStatusSchema(): Promise<void> {
  if (statusSchemaOk === true) return;

  try {
    const defs = await readStatusConstraintDefs();
    if (constraintAllowsInProcess(defs)) {
      statusSchemaOk = true;
      return;
    }

    console.warn("db:status — invalid constraint, repairing…", defs);
    await fixArtistStatusConstraint();

    const after = await readStatusConstraintDefs();
    if (!constraintAllowsInProcess(after)) {
      statusSchemaOk = false;
      throw new Error(
        `artists status constraint still invalid after repair: ${after.join("; ") || "none"}`,
      );
    }

    statusSchemaOk = true;
  } catch (error) {
    statusSchemaOk = false;
    throw error;
  }
}

export async function getStatusConstraintInfo(): Promise<{
  ok: boolean;
  definitions: string[];
}> {
  try {
    const definitions = await readStatusConstraintDefs();
    return { ok: constraintAllowsInProcess(definitions), definitions };
  } catch {
    return { ok: false, definitions: [] };
  }
}

export async function runMigrations(): Promise<void> {
  if (migrated) {
    await ensureArtistStatusSchema();
    return;
  }
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
    UPDATE artists SET notes = '' WHERE notes IS NULL
  `);
  await db.execute(sql`
    UPDATE artists SET email = '' WHERE email IS NULL
  `);
  await db.execute(sql`
    UPDATE artists SET tag = '' WHERE tag IS NULL
  `);

  await fixArtistStatusConstraint();
  statusSchemaOk = true;

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
