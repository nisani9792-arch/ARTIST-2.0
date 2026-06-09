import {
  closestCorners,
  pointerWithin,
  type CollisionDetection,
  type DragEndEvent,
} from "@dnd-kit/core";
import type { Artist, ArtistStatus } from "@/lib/types";
import type { BoardColumnStatus } from "@/stores/useUiStore";

const isBoardColumn = (status: string): status is BoardColumnStatus =>
  status === "in_process" || status === "signed";

export const boardCollisionDetection: CollisionDetection = (args) => {
  const pointerHits = pointerWithin(args);
  if (pointerHits.length > 0) {
    const columnHit = pointerHits.find((hit) => {
      const container = args.droppableContainers.find((c) => c.id === hit.id);
      return container?.data.current?.type === "artist-column";
    });
    if (columnHit) return [columnHit];
    return pointerHits;
  }
  return closestCorners(args);
};

export function resolveBoardDropStatus(event: DragEndEvent): BoardColumnStatus | null {
  const { over } = event;
  if (!over) return null;

  const data = over.data.current as
    | { type?: string; status?: ArtistStatus; artist?: Artist }
    | undefined;

  if (data?.type === "artist-column" && data.status && isBoardColumn(data.status)) {
    return data.status;
  }

  if (data?.type === "artist" && data.artist && isBoardColumn(data.artist.status)) {
    return data.artist.status;
  }

  const raw = String(over.id);
  if (isBoardColumn(raw)) return raw;

  return null;
}
