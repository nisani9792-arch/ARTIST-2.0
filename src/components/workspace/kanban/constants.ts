/** Compact kanban row height (px) */
export const COMPACT_CARD_HEIGHT = 40;

export const DRAG_MIME_IDS = "application/x-artist-ids";

export type KanbanColumnId = "unsigned" | "stuck" | "signed";

export const KANBAN_COLUMNS: Array<{
  id: KanbanColumnId;
  label: string;
  tone: string;
}> = [
  { id: "unsigned", label: "לא חתום", tone: "unsigned" },
  { id: "stuck", label: "תקוע", tone: "stuck" },
  { id: "signed", label: "חתום", tone: "signed" },
];
