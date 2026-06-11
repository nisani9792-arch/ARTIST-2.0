import { and, eq, ilike, inArray, isNull, lt, or, sql } from "drizzle-orm";
import { normalizeArtistId } from "./artist-id";
import { artistNameKey } from "./artist-names";
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

/** Neon legacy schema requires NOT NULL on text fields — never write null. */
function textOrEmpty(value: string | null | undefined): string {
  return value?.trim() ?? "";
}

function statusForDb(
  status: ArtistStatus | string | undefined,
  fallback: ArtistStatus = "unsigned",
): ArtistStatus {
  if (status === undefined) return fallback;
  return normalizeStatus(status);
}

export class DuplicateArtistError extends Error {
  existing: Artist;

  constructor(existing: Artist) {
    super(`אומן בשם "${existing.name}" כבר קיים במערכת`);
    this.name = "DuplicateArtistError";
    this.existing = existing;
  }
}

export type DuplicateGroup = {
  key: string;
  name: string;
  artists: Artist[];
};

export function isDbConstraintError(error: unknown): boolean {
  const raw = error instanceof Error ? error.message : String(error);
  return /artists_status_check|violates check constraint/i.test(raw);
}

export function friendlyDbError(error: unknown): string {
  if (isDbConstraintError(error)) {
    return "סטטוס לא תקין במסד הנתונים — המערכת מעדכנת את הסכימה, נסה שוב בעוד דקה";
  }
  return error instanceof Error ? error.message : "שגיאה בפעולה";
}

export type ArtistsScope = "board" | "vault" | "all";

export async function listHandlers(): Promise<string[]> {
  const rows = await db
    .selectDistinct({ owner: artists.owner })
    .from(artists)
    .where(activeArtists());
  return rows.map((r) => r.owner).filter(Boolean).sort((a, b) => a.localeCompare(b, "he"));
}

export async function listArtists(
  query?: string,
  includeDeleted = false,
  scope: ArtistsScope = "all",
): Promise<Artist[]> {
  const trimmed = query?.trim();
  const conditions = includeDeleted ? [] : [activeArtists()];

  if (scope === "board") {
    conditions.push(inArray(artists.status, ["signed", "in_process", "stuck"]));
  } else if (scope === "vault") {
    conditions.push(eq(artists.status, "unsigned"));
  }

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
  notes?: string;
  email?: string;
  tag?: string;
};

export async function getArtistById(id: string): Promise<Artist | null> {
  const artistId = normalizeArtistId(id);
  const [row] = await db
    .select()
    .from(artists)
    .where(and(eq(artists.id, artistId), activeArtists()))
    .limit(1);
  return row ? toArtist(row) : null;
}

export async function findArtistByNormalizedName(name: string): Promise<Artist | null> {
  const trimmed = name.trim();
  const key = artistNameKey(trimmed);
  if (!key) return null;

  const [exact] = await db
    .select()
    .from(artists)
    .where(and(activeArtists(), eq(artists.nameHe, trimmed)))
    .limit(1);
  if (exact) return toArtist(exact);

  const [fuzzy] = await db
    .select()
    .from(artists)
    .where(and(activeArtists(), ilike(artists.nameHe, trimmed)))
    .limit(1);
  if (fuzzy && artistNameKey(fuzzy.nameHe) === key) return toArtist(fuzzy);

  const rows = await db.select().from(artists).where(activeArtists());
  for (const row of rows) {
    if (artistNameKey(row.nameHe) === key) return toArtist(row);
  }
  return null;
}

export async function createArtist(
  input: CreateArtistInput | string,
  options?: { allowDuplicate?: boolean },
): Promise<Artist> {
  const data = typeof input === "string" ? { name: input } : input;
  const name = data.name.trim();
  if (!options?.allowDuplicate) {
    const existing = await findArtistByNormalizedName(name);
    if (existing) throw new DuplicateArtistError(existing);
  }
  const id = crypto.randomUUID();
  const [row] = await db
    .insert(artists)
    .values({
      id,
      nameHe: name,
      status: statusForDb(data.status, "unsigned"),
      owner: data.handlerName?.trim() || DEFAULT_HANDLER,
      isOdooApproved: data.isOdooApproved ?? false,
      songCount: 0,
      notes: textOrEmpty(data.notes),
      email: textOrEmpty(data.email),
      tag: textOrEmpty(data.tag),
      updatedAt: sql`NOW()`,
    })
    .returning();

  return toArtist(row);
}

async function findArtistsByNames(names: string[]): Promise<Map<string, Artist>> {
  const unique = [...new Set(names.map((n) => n.trim()).filter(Boolean))];
  const result = new Map<string, Artist>();
  if (unique.length === 0) return result;

  const rows = await db.select().from(artists).where(activeArtists());
  const byNormalizedKey = new Map<string, Artist>();
  for (const row of rows) {
    const key = artistNameKey(row.nameHe);
    if (key && !byNormalizedKey.has(key)) {
      byNormalizedKey.set(key, toArtist(row));
    }
  }

  for (const name of unique) {
    const lookupKey = artistNameKey(name);
    const found = byNormalizedKey.get(lookupKey);
    if (found) result.set(name.toLowerCase(), found);
  }

  return result;
}

export async function upsertArtistsByNames(input: {
  entries: Array<{ name: string; note?: string }>;
  status?: ArtistStatus;
  handlerName?: string;
  isOdooApproved?: boolean;
  createMissing?: boolean;
}): Promise<{
  updated: number;
  created: number;
  total: number;
  matchedExisting: number;
}> {
  let updated = 0;
  let created = 0;
  let matchedExisting = 0;

  const resolvedOdoo =
    input.status === "signed" && input.isOdooApproved === undefined
      ? false
      : input.isOdooApproved;

  const names = input.entries.map((e) => e.name.trim()).filter(Boolean);
  const existingByName = await findArtistsByNames(names);

  for (const entry of input.entries) {
    const name = entry.name.trim();
    if (!name) continue;

    const existing = existingByName.get(name.toLowerCase());

    if (existing) {
      matchedExisting += 1;
      const patch: ArtistPatch = {};
      if (input.status !== undefined) patch.status = input.status;
      if (input.handlerName !== undefined) patch.handlerName = input.handlerName;
      if (resolvedOdoo !== undefined) patch.isOdooApproved = resolvedOdoo;
      if (entry.note) {
        patch.notes = existing.notes ? `${existing.notes}\n${entry.note}` : entry.note;
      }
      if (Object.keys(patch).length > 0) {
        await updateArtist(existing.id, patch);
        updated += 1;
      }
      continue;
    }

    if (input.createMissing !== false) {
      await createArtist({
        name,
        status: input.status ?? "in_process",
        handlerName: input.handlerName,
        isOdooApproved: resolvedOdoo,
        notes: textOrEmpty(entry.note),
      });
      created += 1;
    }
  }

  return { updated, created, total: updated + created, matchedExisting };
}

const STATUS_PRIORITY: Record<ArtistStatus, number> = {
  signed: 3,
  in_process: 2,
  unsigned: 1,
};

export async function mergeArtistsIntoKeep(
  keepId: string,
  removeIds: string[],
): Promise<Artist> {
  const keep = await getArtistById(keepId);
  if (!keep) throw new Error("אומן לשמירה לא נמצא");

  const toRemove = [...new Set(removeIds.map(normalizeArtistId).filter((id) => id !== keepId))];
  if (toRemove.length === 0) return keep;

  let mergedStatus = keep.status;
  let mergedNotes = keep.notes;
  let mergedOdoo = keep.isOdooApproved;

  for (const dupId of toRemove) {
    const dup = await getArtistById(dupId);
    if (!dup) continue;

    if (STATUS_PRIORITY[dup.status] > STATUS_PRIORITY[mergedStatus]) {
      mergedStatus = dup.status;
    }
    if (dup.isOdooApproved) mergedOdoo = true;
    if (dup.notes?.trim()) {
      const note = dup.notes.trim();
      mergedNotes = mergedNotes?.includes(note)
        ? mergedNotes
        : mergedNotes
          ? `${mergedNotes}\n---\n${note}`
          : note;
    }

    await softDeleteArtist(dupId);
  }

  return (
    (await updateArtist(keepId, {
      status: mergedStatus,
      isOdooApproved: mergedOdoo,
      notes: mergedNotes,
    })) ?? keep
  );
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
  if (patch.status !== undefined) values.status = statusForDb(patch.status);
  if (patch.isOdooApproved !== undefined) values.isOdooApproved = patch.isOdooApproved;
  if (patch.songCount !== undefined) values.songCount = Math.max(0, Math.floor(patch.songCount));
  if (patch.handlerName !== undefined) values.owner = patch.handlerName.trim();
  if (patch.email !== undefined) values.email = textOrEmpty(patch.email);
  if (patch.notes !== undefined) values.notes = textOrEmpty(patch.notes);
  if (patch.tag !== undefined) values.tag = textOrEmpty(patch.tag);
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
  if (patch.status !== undefined) values.status = statusForDb(patch.status);
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
      email: textOrEmpty(row.email),
      tag: textOrEmpty(row.tag),
      notes: "",
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
      status: statusForDb(input.status),
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
  const trimmed = [...new Set(input.names.map((n) => n.trim()).filter(Boolean))];
  if (trimmed.length === 0) return 0;

  const values: Record<string, unknown> = {
    updatedAt: sql`NOW()`,
  };
  if (input.status !== undefined) values.status = statusForDb(input.status);
  if (input.isOdooApproved !== undefined) values.isOdooApproved = input.isOdooApproved;
  if (input.handlerName !== undefined) values.owner = input.handlerName.trim();

  const nameMatch = or(
    ...trimmed.flatMap((name) => [
      eq(artists.nameHe, name),
      ilike(artists.nameHe, name),
      ilike(artists.nameHe, `%${name}%`),
    ]),
  )!;

  const rows = await db
    .update(artists)
    .set(values)
    .where(and(activeArtists(), nameMatch))
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
