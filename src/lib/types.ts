import type { ArtistRow } from "./db/schema";

export type Artist = {
  id: string;
  name: string;
  isSigned: boolean;
  isOdooApproved: boolean;
  handlerName: string;
  lastActionTimestamp: string;
};

export const DEFAULT_HANDLER = "לא שויך";

export const statusToSigned = (status: string): boolean => status === "signed";

export const signedToStatus = (isSigned: boolean): string =>
  isSigned ? "signed" : "unsigned";

export const toArtist = (row: ArtistRow): Artist => ({
  id: row.id,
  name: row.nameHe,
  isSigned: statusToSigned(row.status),
  isOdooApproved: row.isOdooApproved,
  handlerName: row.owner,
  lastActionTimestamp: row.updatedAt,
});
