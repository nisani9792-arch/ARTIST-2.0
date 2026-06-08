import type { Artist } from "@/lib/types";

export const buildDragIdPayload = (artistId: string, selectedIds: Set<string>) => {
  const ids =
    selectedIds.has(artistId) && selectedIds.size > 1 ? [...selectedIds] : [artistId];
  return JSON.stringify(ids);
};

export const parseDragIdPayload = (dataTransfer: DataTransfer): string[] => {
  const raw = dataTransfer.getData("application/x-artist-ids");
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === "string") : [];
  } catch {
    return [];
  }
};

export const selectRangeInColumn = (
  artists: Artist[],
  anchorId: string | null,
  targetId: string,
): string[] => {
  if (!anchorId) return [targetId];
  const ids = artists.map((a) => a.id);
  const start = ids.indexOf(anchorId);
  const end = ids.indexOf(targetId);
  if (start < 0 || end < 0) return [targetId];
  const [from, to] = start < end ? [start, end] : [end, start];
  return ids.slice(from, to + 1);
};
