import { and, eq, ilike, inArray, lt, or, sql } from "drizzle-orm";
import { db } from "./db";
import { artists } from "./db/schema";
import {
  DEFAULT_HANDLER,
  signedToStatus,
  toArtist,
  type Artist,
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
      updatedAt: new Date().toISOString(),
    })
    .returning();

  return toArtist(row);
}

export async function updateArtist(
  id: string,
  patch: Partial<Pick<Artist, "name" | "isSigned" | "isOdooApproved" | "handlerName">>,
): Promise<Artist | null> {
  const values: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
  };

  if (patch.name !== undefined) values.nameHe = patch.name.trim();
  if (patch.isSigned !== undefined) values.status = signedToStatus(patch.isSigned);
  if (patch.isOdooApproved !== undefined) values.isOdooApproved = patch.isOdooApproved;
  if (patch.handlerName !== undefined) values.owner = patch.handlerName.trim();

  const [row] = await db
    .update(artists)
    .set(values)
    .where(eq(artists.id, id))
    .returning();

  return row ? toArtist(row) : null;
}

export async function bulkUpdateArtists(
  ids: string[],
  patch: Partial<Pick<Artist, "handlerName" | "isSigned">>,
): Promise<Artist[]> {
  if (ids.length === 0) return [];

  const values: Record<string, unknown> = {
    updatedAt: new Date().toISOString(),
  };

  if (patch.handlerName !== undefined) values.owner = patch.handlerName.trim();
  if (patch.isSigned !== undefined) values.status = signedToStatus(patch.isSigned);

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
    .where(
      lt(artists.updatedAt, sql`now() - make_interval(days => ${days})`),
    );

  return rows.map(toArtist);
}

export async function reassignHandlerByFilter(input: {
  fromHandler?: string;
  toHandler: string;
  isSigned?: boolean;
}): Promise<number> {
  const conditions = [];

  if (input.fromHandler) {
    conditions.push(eq(artists.owner, input.fromHandler));
  }
  if (input.isSigned !== undefined) {
    conditions.push(eq(artists.status, signedToStatus(input.isSigned)));
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
  isSigned: boolean;
  handlerName?: string;
  fromSigned?: boolean;
}): Promise<number> {
  const conditions = [];

  if (input.handlerName) {
    conditions.push(eq(artists.owner, input.handlerName));
  }
  if (input.fromSigned !== undefined) {
    conditions.push(eq(artists.status, signedToStatus(input.fromSigned)));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const rows = await db
    .update(artists)
    .set({
      status: signedToStatus(input.isSigned),
      updatedAt: new Date().toISOString(),
    })
    .where(whereClause)
    .returning({ id: artists.id });

  return rows.length;
}
