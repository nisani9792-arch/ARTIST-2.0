import { and, eq, ilike, inArray, isNull, lt, or, sql } from "drizzle-orm";
import { db } from "./db";
import { artists, folders } from "./db/schema";
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

export async function createArtist(name: string): Promise<Artist> {
  const id = crypto.randomUUID();
  const [row] = await db
    .insert(artists)
    .values({
      id,
      nameHe: name.trim(),
      status: "unsigned",
      owner: DEFAULT_HANDLER,
      isOdooApproved: false,
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
  const values: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
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

  const [row] = await db.update(artists).set(values).where(eq(artists.id, id)).returning();

  return row ? toArtist(row) : null;
}

export async function softDeleteArtist(id: string): Promise<Artist | null> {
  return updateArtist(id, { deletedAt: new Date().toISOString() });
}

export async function restoreArtist(id: string): Promise<Artist | null> {
  return updateArtist(id, { deletedAt: null });
}

export async function bulkUpdateArtists(
  ids: string[],
  patch: Partial<Pick<Artist, "handlerName" | "status" | "isOdooApproved" | "songCount" | "folderId">>,
): Promise<Artist[]> {
  if (ids.length === 0) return [];

  const values: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
  };

  if (patch.handlerName !== undefined) values.owner = patch.handlerName.trim();
  if (patch.status !== undefined) values.status = patch.status;
  if (patch.isOdooApproved !== undefined) values.isOdooApproved = patch.isOdooApproved;
  if (patch.songCount !== undefined) values.songCount = Math.max(0, Math.floor(patch.songCount));
  if (patch.folderId !== undefined) values.folderId = patch.folderId;

  const rows = await db
    .update(artists)
    .set(values)
    .where(inArray(artists.id, ids))
    .returning();

  return rows.map(toArtist);
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

export async function migrateStuckToInProcess(): Promise<number> {
  const rows = await db
    .update(artists)
    .set({ status: "in_process", updatedAt: new Date().toISOString() })
    .where(eq(artists.status, "stuck"))
    .returning({ id: artists.id });
  return rows.length;
}
