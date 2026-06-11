import type { ArtistRow, FolderRow } from "./db/schema";

export type ArtistStatus = "signed" | "unsigned" | "in_process";

export type Artist = {
  id: string;
  name: string;
  status: ArtistStatus;
  isOdooApproved: boolean;
  songCount: number;
  handlerName: string;
  email: string;
  notes: string;
  tag: string;
  folderId: string | null;
  deletedAt: string | null;
  lastActionTimestamp: string;
};

export type Folder = {
  id: string;
  name: string;
  updatedAt: string;
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

const IN_PROCESS_ALIASES = new Set([
  "in_process",
  "stuck",
  "failed",
  "in-process",
  "in process",
  "inprogress",
  "בעבודה",
]);

export const normalizeStatus = (raw: string): ArtistStatus => {
  const s = (raw ?? "").trim().toLowerCase();
  if (s === "signed") return "signed";
  if (IN_PROCESS_ALIASES.has(s)) return "in_process";
  return "unsigned";
};

export const toArtist = (row: ArtistRow): Artist => ({
  id: row.id,
  name: row.nameHe,
  status: normalizeStatus(row.status),
  isOdooApproved: row.isOdooApproved,
  songCount: row.songCount ?? 0,
  handlerName: row.owner,
  email: row.email ?? "",
  notes: row.notes ?? "",
  tag: row.tag ?? "",
  folderId: row.folderId ?? null,
  deletedAt: row.deletedAt ?? null,
  lastActionTimestamp: row.updatedAt,
});

export const toFolder = (row: FolderRow): Folder => ({
  id: row.id,
  name: row.name,
  updatedAt: row.updatedAt,
});
