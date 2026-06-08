import { and, eq, ilike, inArray, lt, or, sql } from "drizzle-orm";
import { db } from "./db";
import { artists } from "./db/schema";
import {
  DEFAULT_HANDLER,
  normalizeStatus,
  toArtist,
  type Artist,
  type ArtistStats,
  type ArtistStatus,
} from "./types";

export async function listArtists(query?: string): Promise<Artist[]> {
  const trimmed = query?.trim();

  const rows = trimmed
    ? await db
        .select()
        .from(artists)
        .where(
          or(
            ilike(artists.nameHe, `%${trimmed}%`),
            ilike(artists.owner, `%${trimmed}%`),
          ),
        )
        .orderBy(artists.updatedAt)
    : await db.select().from(artists).orderBy(artists.updatedAt);

  return rows.map(toArtist);
}

export async function getArtistStats(): Promise<ArtistStats> {
  const [row] = await db
    .select({
      total: sql<number>`count(*)::int`,
      signed: sql<number>`count(*) filter (where ${artists.status} = 'signed')::int`,
      unsigned: sql<number>`count(*) filter (where ${artists.status} = 'unsigned')::int`,
      in_process: sql<number>`count(*) filter (where ${artists.status} in ('in_process', 'stuck'))::int`,
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
  Pick<Artist, "name" | "status" | "isOdooApproved" | "songCount" | "handlerName">
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

  const [row] = await db.update(artists).set(values).where(eq(artists.id, id)).returning();

  return row ? toArtist(row) : null;
}

export async function bulkUpdateArtists(
  ids: string[],
  patch: Partial<Pick<Artist, "handlerName" | "status" | "isOdooApproved" | "songCount">>,
): Promise<Artist[]> {
  if (ids.length === 0) return [];

  const values: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
  };

  if (patch.handlerName !== undefined) values.owner = patch.handlerName.trim();
  if (patch.status !== undefined) values.status = patch.status;
  if (patch.isOdooApproved !== undefined) values.isOdooApproved = patch.isOdooApproved;
  if (patch.songCount !== undefined) values.songCount = Math.max(0, Math.floor(patch.songCount));

  const rows = await db
    .update(artists)
    .set(values)
    .where(inArray(artists.id, ids))
    .returning();

  return rows.map(toArtist);
}

export async function findStuckArtists(days = 14): Promise<Artist[]> {
  const rows = await db
    .select()
    .from(artists)
    .where(lt(artists.updatedAt, sql`now() - make_interval(days => ${days})`));

  return rows.map(toArtist);
}

export async function reassignHandlerByFilter(input: {
  fromHandler?: string;
  toHandler: string;
  status?: ArtistStatus;
}): Promise<number> {
  const conditions = [];

  if (input.fromHandler) {
    conditions.push(eq(artists.owner, input.fromHandler));
  }
  if (input.status !== undefined) {
    conditions.push(eq(artists.status, input.status));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const rows = await db
    .update(artists)
    .set({
      owner: input.toHandler.trim(),
      updatedAt: new Date().toISOString(),
    })
    .where(whereClause)
    .returning({ id: artists.id });

  return rows.length;
}

export async function markSignedByFilter(input: {
  status: ArtistStatus;
  handlerName?: string;
  fromStatus?: ArtistStatus;
}): Promise<number> {
  const conditions = [];

  if (input.handlerName) {
    conditions.push(eq(artists.owner, input.handlerName));
  }
  if (input.fromStatus !== undefined) {
    conditions.push(eq(artists.status, input.fromStatus));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const rows = await db
    .update(artists)
    .set({
      status: input.status,
      updatedAt: new Date().toISOString(),
    })
    .where(whereClause)
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
