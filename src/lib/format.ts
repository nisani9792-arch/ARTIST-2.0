import { STATUS_META, type ArtistStatus } from "./types";

export function formatHebrewDateTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat("he-IL", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function statusLabel(status: ArtistStatus): string {
  return STATUS_META[status]?.label ?? status;
}
