import {
  closestCorners,
  pointerWithin,
  type CollisionDetection,
  type DragEndEvent,
} from "@dnd-kit/core";
import type { Artist } from "@/lib/types";
import { isBoardColumnId, type BoardColumnId } from "@/lib/board-columns";

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

export function resolveBoardDropColumn(event: DragEndEvent): BoardColumnId | null {
  const { over } = event;
  if (!over) return null;

  const data = over.data.current as
    | { type?: string; columnId?: BoardColumnId; artist?: Artist }
    | undefined;

  if (data?.type === "artist-column" && data.columnId && isBoardColumnId(data.columnId)) {
    return data.columnId;
  }

  const raw = String(over.id);
  if (isBoardColumnId(raw)) return raw;

  return null;
}
