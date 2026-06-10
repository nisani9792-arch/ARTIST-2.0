import type { Artist, ArtistStatus } from "./types";

export type BoardColumnId = "in_process" | "signed_pending_odoo" | "signed_approved";

export const BOARD_COLUMN_IDS: BoardColumnId[] = [
  "in_process",
  "signed_pending_odoo",
  "signed_approved",
];

export const DEFAULT_BOARD_COLUMN_ORDER: BoardColumnId[] = [
  "in_process",
  "signed_pending_odoo",
  "signed_approved",
];

export const DEFAULT_BOARD_COLUMN_WIDTHS: Record<BoardColumnId, number> = {
  in_process: 34,
  signed_pending_odoo: 33,
  signed_approved: 33,
};

export type BoardColumnMeta = {
  label: string;
  shortLabel: string;
  tone: ArtistStatus | "signed_pending";
  artistStatus: ArtistStatus;
};

export const BOARD_COLUMN_META: Record<BoardColumnId, BoardColumnMeta> = {
  in_process: {
    label: "בעבודה",
    shortLabel: "בעבודה",
    tone: "in_process",
    artistStatus: "in_process",
  },
  signed_pending_odoo: {
    label: "חתום — ממתין Odoo",
    shortLabel: "חתום ללא Odoo",
    tone: "signed_pending",
    artistStatus: "signed",
  },
  signed_approved: {
    label: "חתום — Odoo מאושר",
    shortLabel: "חתום",
    tone: "signed",
    artistStatus: "signed",
  },
};

export function isBoardColumnId(value: string): value is BoardColumnId {
  return BOARD_COLUMN_IDS.includes(value as BoardColumnId);
}

export function artistMatchesColumn(artist: Artist, columnId: BoardColumnId): boolean {
  if (columnId === "in_process") return artist.status === "in_process";
  if (columnId === "signed_pending_odoo") {
    return artist.status === "signed" && !artist.isOdooApproved;
  }
  return artist.status === "signed" && artist.isOdooApproved;
}

export function filterArtistsForColumn(artists: Artist[], columnId: BoardColumnId): Artist[] {
  return artists.filter((a) => artistMatchesColumn(a, columnId));
}

export function filterArtistsByColumnSearch(artists: Artist[], query: string): Artist[] {
  const q = query.trim().toLowerCase();
  if (!q) return artists;
  return artists.filter(
    (a) =>
      a.name.toLowerCase().includes(q) ||
      a.handlerName.toLowerCase().includes(q) ||
      a.notes.toLowerCase().includes(q) ||
      a.tag.toLowerCase().includes(q),
  );
}

export type ColumnDropPatch = {
  status: ArtistStatus;
  isOdooApproved?: boolean;
};

export function columnDropPatch(columnId: BoardColumnId): ColumnDropPatch {
  switch (columnId) {
    case "in_process":
      return { status: "in_process" };
    case "signed_pending_odoo":
      return { status: "signed", isOdooApproved: false };
    case "signed_approved":
      return { status: "signed", isOdooApproved: true };
  }
}

export function migrateColumnOrder(order: unknown): BoardColumnId[] {
  if (!Array.isArray(order)) return [...DEFAULT_BOARD_COLUMN_ORDER];
  const ids = order.filter((id): id is string => typeof id === "string");

  if (ids.includes("signed_pending_odoo") || ids.includes("signed_approved")) {
    const migrated = ids.filter(isBoardColumnId);
    return migrated.length ? migrated : [...DEFAULT_BOARD_COLUMN_ORDER];
  }

  if (ids.includes("signed")) {
    const result: BoardColumnId[] = [];
    for (const id of ids) {
      if (id === "signed") {
        result.push("signed_pending_odoo", "signed_approved");
      } else if (id === "in_process") {
        result.push("in_process");
      }
    }
    return result.length ? [...new Set(result)] : [...DEFAULT_BOARD_COLUMN_ORDER];
  }

  const migrated = ids.filter(isBoardColumnId);
  return migrated.length ? migrated : [...DEFAULT_BOARD_COLUMN_ORDER];
}

export function migrateColumnWidths(
  widths: unknown,
  order: BoardColumnId[],
): Record<BoardColumnId, number> {
  const raw = (widths && typeof widths === "object" ? widths : {}) as Record<string, number>;
  if (raw.signed_pending_odoo != null || raw.signed_approved != null) {
    const next = { ...DEFAULT_BOARD_COLUMN_WIDTHS };
    for (const id of BOARD_COLUMN_IDS) {
      if (typeof raw[id] === "number") next[id] = raw[id];
    }
    return normalizeWidthsForOrder(next, order);
  }

  const legacySigned = typeof raw.signed === "number" ? raw.signed : 58;
  const legacyInProcess = typeof raw.in_process === "number" ? raw.in_process : 42;
  const next: Record<BoardColumnId, number> = {
    in_process: legacyInProcess,
    signed_pending_odoo: legacySigned / 2,
    signed_approved: legacySigned / 2,
  };
  return normalizeWidthsForOrder(next, order);
}

function normalizeWidthsForOrder(
  widths: Record<BoardColumnId, number>,
  order: BoardColumnId[],
): Record<BoardColumnId, number> {
  const total = order.reduce((sum, id) => sum + (widths[id] ?? 0), 0) || 100;
  const next = { ...widths };
  for (const id of order) {
    next[id] = ((widths[id] ?? 100 / order.length) / total) * 100;
  }
  return next;
}

export function exportParamsForColumn(columnId: BoardColumnId): URLSearchParams {
  const params = new URLSearchParams({ scope: "all" });
  if (columnId === "in_process") {
    params.set("status", "in_process");
  } else if (columnId === "signed_pending_odoo") {
    params.set("status", "signed");
    params.set("odoo", "pending");
  } else {
    params.set("status", "signed");
    params.set("odoo", "approved");
  }
  return params;
}
