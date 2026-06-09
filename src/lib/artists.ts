import { and, eq, ilike, inArray, isNull, lt, or, sql } from "drizzle-orm";
import { normalizeArtistId } from "./artist-id";
import { db } from "./db";
import { artists, folders, type ArtistRow } from "./db/schema";
import {
  DEFAULT_HANDLER,
  normalizeStatus,
  toArtist,
  toFolder,
  type Artist,
  type ArtistStats,
  type ArtistStatus,
  type Folder,
} from "./types";

const activeArtists = () => isNull(artists.deletedAt);

export async function listArtists(query?: string, includeDeleted = false): Promise<Artist[]> {
  const trimmed = query?.trim();
  const conditions = includeDeleted ? [] : [activeArtists()];

  if (trimmed) {
    conditions.push(
      or(
        ilike(artists.nameHe, `%${trimmed}%`),
        ilike(artists.owner, `%${trimmed}%`),
        ilike(artists.tag, `%${trimmed}%`),
        ilike(artists.email, `%${trimmed}%`),
      )!,
    );
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const rows = await db
    .select()
    .from(artists)
    .where(whereClause)
    .orderBy(artists.updatedAt);

  return rows.map(toArtist);
}

export async function listTrashArtists(): Promise<Artist[]> {
  const rows = await db
    .select()
    .from(artists)
    .where(sql`${artists.deletedAt} IS NOT NULL`)
    .orderBy(artists.deletedAt);
  return rows.map(toArtist);
}

export async function getArtistStats(): Promise<ArtistStats> {
  const [row] = await db
    .select({
      total: sql<number>`count(*) filter (where ${artists.deletedAt} IS NULL)::int`,
      signed: sql<number>`count(*) filter (where ${artists.status} = 'signed' AND ${artists.deletedAt} IS NULL)::int`,
      unsigned: sql<number>`count(*) filter (where ${artists.status} = 'unsigned' AND ${artists.deletedAt} IS NULL)::int`,
      in_process: sql<number>`count(*) filter (where ${artists.status} in ('in_process', 'stuck') AND ${artists.deletedAt} IS NULL)::int`,
    })
    .from(artists);

  return {
    total: row?.total ?? 0,
    signed: row?.signed ?? 0,
    unsigned: row?.unsigned ?? 0,
    in_process: row?.in_process ?? 0,
  };
}

export type CreateArtistInput = {
  name: string;
  status?: ArtistStatus;
  handlerName?: string;
  isOdooApproved?: boolean;
};

export async function createArtist(input: CreateArtistInput | string): Promise<Artist> {
  const data = typeof input === "string" ? { name: input } : input;
  const name = data.name.trim();
  const id = crypto.randomUUID();
  const [row] = await db
    .insert(artists)
    .values({
      id,
      nameHe: name,
      status: data.status ?? "unsigned",
      owner: data.handlerName?.trim() || DEFAULT_HANDLER,
      isOdooApproved: data.isOdooApproved ?? false,
      songCount: 0,
      updatedAt: new Date().toISOString(),
    })
    .returning();

  return toArtist(row);
}

type ArtistPatch = Partial<
  Pick<
    Artist,
    | "name"
    | "status"
    | "isOdooApproved"
    | "songCount"
    | "handlerName"
    | "email"
    | "notes"
    | "tag"
    | "folderId"
    | "deletedAt"
  >
>;

export async function updateArtist(id: string, patch: ArtistPatch): Promise<Artist | null> {
  const artistId = normalizeArtistId(id);
  const values: Record<string, unknown> = {
    updatedAt: sql`NOW()`,
  };

  if (patch.name !== undefined) values.nameHe = patch.name.trim();
  if (patch.status !== undefined) values.status = patch.status;
  if (patch.isOdooApproved !== undefined) values.isOdooApproved = patch.isOdooApproved;
  if (patch.songCount !== undefined) values.songCount = Math.max(0, Math.floor(patch.songCount));
  if (patch.handlerName !== undefined) values.owner = patch.handlerName.trim();
  if (patch.email !== undefined) values.email = patch.email.trim();
  if (patch.notes !== undefined) values.notes = patch.notes;
  if (patch.tag !== undefined) values.tag = patch.tag.trim();
  if (patch.folderId !== undefined) values.folderId = patch.folderId;
  if (patch.deletedAt !== undefined) values.deletedAt = patch.deletedAt;

  const [row] = await db
    .update(artists)
    .set(values)
    .where(and(eq(artists.id, artistId), activeArtists()))
    .returning();

  return row ? toArtist(row) : null;
}

export type StatusUpdateResult = {
  artists: Artist[];
  count: number;
  missingIds: string[];
};

/** Primary API for changing artist status — avoids Hebrew ids in URL paths. */
export async function updateArtistsStatus(
  ids: string[],
  status: ArtistStatus,
): Promise<StatusUpdateResult> {
  const uniqueIds = [...new Set(ids.map(normalizeArtistId).filter(Boolean))];
  if (uniqueIds.length === 0) {
    throw new Error("לא צוינו אומנים לעדכון");
  }

  const updated = await bulkUpdateArtists(uniqueIds, { status });
  const updatedIds = new Set(updated.map((a) => a.id));
  const missingIds = uniqueIds.filter((id) => !updatedIds.has(id));

  if (updated.length === 0) {
    throw new Error(
      `לא נמצאו אומנים פעילים לעדכון. ניסיון לעדכן ${uniqueIds.length} מזהים.`,
    );
  }

  return { artists: updated, count: updated.length, missingIds };
}

export async function softDeleteArtist(id: string): Promise<Artist | null> {
  return updateArtist(id, { deletedAt: new Date().toISOString() });
}

export async function restoreArtist(id: string): Promise<Artist | null> {
  return updateArtist(id, { deletedAt: null });
}

const BULK_CHUNK_SIZE = 80;

export async function bulkUpdateArtists(
  ids: string[],
  patch: Partial<Pick<Artist, "handlerName" | "status" | "isOdooApproved" | "songCount" | "folderId">>,
): Promise<Artist[]> {
  const uniqueIds = [...new Set(ids.map(normalizeArtistId).filter(Boolean))];
  if (uniqueIds.length === 0) return [];

  const values: Record<string, unknown> = {
    updatedAt: sql`NOW()`,
  };

  if (patch.handlerName !== undefined) values.owner = patch.handlerName.trim();
  if (patch.status !== undefined) values.status = patch.status;
  if (patch.isOdooApproved !== undefined) values.isOdooApproved = patch.isOdooApproved;
  if (patch.songCount !== undefined) values.songCount = Math.max(0, Math.floor(patch.songCount));
  if (patch.folderId !== undefined) values.folderId = patch.folderId;

  if (Object.keys(values).length <= 1) {
    throw new Error("לא צוינו שדות לעדכון");
  }

  const allRows: ArtistRow[] = [];

  for (let i = 0; i < uniqueIds.length; i += BULK_CHUNK_SIZE) {
    const chunk = uniqueIds.slice(i, i + BULK_CHUNK_SIZE);
    const rows = await db
      .update(artists)
      .set(values)
      .where(and(inArray(artists.id, chunk), activeArtists()))
      .returning();
    allRows.push(...rows);
  }

  return allRows.map(toArtist);
}

export async function importArtistsFromRows(
  rows: Array<{ name: string; status?: string; handler?: string; email?: string; tag?: string }>,
): Promise<number> {
  let created = 0;
  for (const row of rows) {
    const name = row.name?.trim();
    if (!name) continue;
    const existing = await db
      .select({ id: artists.id })
      .from(artists)
      .where(and(eq(artists.nameHe, name), activeArtists()))
      .limit(1);
    if (existing.length > 0) continue;

    await db.insert(artists).values({
      id: crypto.randomUUID(),
      nameHe: name,
      status: normalizeStatus(row.status ?? "unsigned"),
      owner: row.handler?.trim() || DEFAULT_HANDLER,
      email: row.email?.trim() || null,
      tag: row.tag?.trim() || null,
      isOdooApproved: false,
      songCount: 0,
      updatedAt: new Date().toISOString(),
    });
    created += 1;
  }
  return created;
}

export async function listFolders(): Promise<Folder[]> {
  const rows = await db.select().from(folders).orderBy(folders.name);
  return rows.map(toFolder);
}

export async function createFolder(name: string): Promise<Folder> {
  const id = crypto.randomUUID();
  const [row] = await db
    .insert(folders)
    .values({ id, name: name.trim(), updatedAt: new Date().toISOString() })
    .returning();
  return toFolder(row);
}

export async function findStuckArtists(days = 14): Promise<Artist[]> {
  const rows = await db
    .select()
    .from(artists)
    .where(and(lt(artists.updatedAt, sql`now() - make_interval(days => ${days})`), activeArtists()));

  return rows.map(toArtist);
}

export async function reassignHandlerByFilter(input: {
  fromHandler?: string;
  toHandler: string;
  status?: ArtistStatus;
}): Promise<number> {
  const conditions = [activeArtists()];

  if (input.fromHandler) conditions.push(eq(artists.owner, input.fromHandler));
  if (input.status !== undefined) conditions.push(eq(artists.status, input.status));

  const rows = await db
    .update(artists)
    .set({
      owner: input.toHandler.trim(),
      updatedAt: new Date().toISOString(),
    })
    .where(and(...conditions))
    .returning({ id: artists.id });

  return rows.length;
}

export async function markSignedByFilter(input: {
  status: ArtistStatus;
  handlerName?: string;
  fromStatus?: ArtistStatus;
}): Promise<number> {
  const conditions = [activeArtists()];

  if (input.handlerName) conditions.push(eq(artists.owner, input.handlerName));
  if (input.fromStatus !== undefined) conditions.push(eq(artists.status, input.fromStatus));

  const rows = await db
    .update(artists)
    .set({
      status: input.status,
      updatedAt: new Date().toISOString(),
    })
    .where(and(...conditions))
    .returning({ id: artists.id });

  return rows.length;
}

export async function updateArtistsByNames(input: {
  names: string[];
  status?: ArtistStatus;
  isOdooApproved?: boolean;
  handlerName?: string;
}): Promise<number> {
  const trimmed = input.names.map((n) => n.trim()).filter(Boolean);
  if (trimmed.length === 0) return 0;

  const values: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
  };
  if (input.status !== undefined) values.status = input.status;
  if (input.isOdooApproved !== undefined) values.isOdooApproved = input.isOdooApproved;
  if (input.handlerName !== undefined) values.owner = input.handlerName.trim();

  const rows = await db
    .update(artists)
    .set(values)
    .where(
      and(
        activeArtists(),
        inArray(artists.nameHe, trimmed),
      ),
    )
    .returning({ id: artists.id });

  return rows.length;
}

export async function markOdooByFilter(input: {
  isOdooApproved: boolean;
  status?: ArtistStatus;
  handlerName?: string;
}): Promise<number> {
  const conditions = [activeArtists()];
  if (input.status !== undefined) conditions.push(eq(artists.status, input.status));
  if (input.handlerName) conditions.push(eq(artists.owner, input.handlerName));

  const rows = await db
    .update(artists)
    .set({
      isOdooApproved: input.isOdooApproved,
      updatedAt: new Date().toISOString(),
    })
    .where(and(...conditions))
    .returning({ id: artists.id });

  return rows.length;
}

export async function migrateStuckToInProcess(): Promise<number> {
  const rows = await db
    .update(artists)
    .set({ status: "in_process", updatedAt: new Date().toISOString() })
    .where(eq(artists.status, "stuck"))
    .returning({ id: artists.id });
  return rows.length;
}
