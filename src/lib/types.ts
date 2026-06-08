import type { ArtistRow } from "./db/schema";

export type ArtistStatus = "signed" | "unsigned" | "in_process";

export type Artist = {
  id: string;
  name: string;
  status: ArtistStatus;
  isOdooApproved: boolean;
  songCount: number;
  handlerName: string;
  lastActionTimestamp: string;
};

export type ArtistStats = {
  total: number;
  signed: number;
  unsigned: number;
  in_process: number;
};

export const DEFAULT_HANDLER = "לא שויך";

export const STATUS_META: Record<ArtistStatus, { label: string; tone: string }> = {
  signed: { label: "חתום", tone: "signed" },
  unsigned: { label: "לא חתום", tone: "unsigned" },
  in_process: { label: "בעבודה", tone: "in_process" },
};

export const MAIN_BOARD_STATUSES: ArtistStatus[] = ["in_process", "signed"];

export const normalizeStatus = (raw: string): ArtistStatus => {
  if (raw === "signed") return "signed";
  if (raw === "in_process" || raw === "stuck") return "in_process";
  return "unsigned";
};

/** @deprecated use artist.status === "signed" */
export const statusToSigned = (status: string): boolean => status === "signed";

export const toArtist = (row: ArtistRow): Artist => ({
  id: row.id,
  name: row.nameHe,
  status: normalizeStatus(row.status),
  isOdooApproved: row.isOdooApproved,
  songCount: row.songCount ?? 0,
  handlerName: row.owner,
  lastActionTimestamp: row.updatedAt,
});
