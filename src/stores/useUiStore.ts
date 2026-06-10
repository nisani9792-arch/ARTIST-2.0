import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import {
  DEFAULT_BOARD_COLUMN_ORDER,
  DEFAULT_BOARD_COLUMN_WIDTHS,
  migrateColumnOrder,
  migrateColumnWidths,
  type BoardColumnId,
} from "@/lib/board-columns";
import type { ArtistStatus } from "@/lib/types";

export type { BoardColumnId };
export type BoardColumnStatus = BoardColumnId;
export type ViewMode = "kanban" | "list";

const MIN_COL_WIDTH = 18;
const MAX_COL_WIDTH = 55;
const MIN_VAULT_WIDTH = 18;
const MAX_VAULT_WIDTH = 45;
const DEFAULT_VAULT_WIDTH = 28;

const emptyColumnSearch = (): Record<BoardColumnId, string> => ({
  in_process: "",
  signed_pending_odoo: "",
  signed_approved: "",
});

type UiState = {
  vaultOpen: boolean;
  commandOpen: boolean;
  quickEditArtistId: string | null;
  statusFilter: "all" | "signed" | "unsigned" | "in_process";
  viewMode: ViewMode;
  mobileBoardTab: BoardColumnId;
  columnOrder: BoardColumnId[];
  columnWidths: Record<BoardColumnId, number>;
  columnSearch: Record<BoardColumnId, string>;
  vaultWidthPct: number;
  commandQuery: string;
  vaultSearch: string;
  setVaultOpen: (open: boolean) => void;
  toggleVault: () => void;
  setCommandOpen: (open: boolean) => void;
  setQuickEditArtistId: (id: string | null) => void;
  setStatusFilter: (filter: UiState["statusFilter"]) => void;
  setViewMode: (mode: ViewMode) => void;
  setMobileBoardTab: (tab: BoardColumnId) => void;
  setColumnOrder: (order: BoardColumnId[]) => void;
  moveColumn: (columnId: BoardColumnId, direction: -1 | 1) => void;
  resizeAdjacentColumns: (
    left: BoardColumnId,
    right: BoardColumnId,
    deltaPct: number,
  ) => void;
  resizeVaultWidth: (deltaPct: number) => void;
  setCommandQuery: (query: string) => void;
  setVaultSearch: (query: string) => void;
  setColumnSearch: (columnId: BoardColumnId, query: string) => void;
  resetColumnLayout: () => void;
};

export const useUiStore = create<UiState>()(
  persist(
    (set, get) => ({
      vaultOpen: false,
      commandOpen: false,
      quickEditArtistId: null,
      statusFilter: "all",
      viewMode: "kanban",
      mobileBoardTab: "in_process",
      columnOrder: [...DEFAULT_BOARD_COLUMN_ORDER],
      columnWidths: { ...DEFAULT_BOARD_COLUMN_WIDTHS },
      columnSearch: emptyColumnSearch(),
      vaultWidthPct: DEFAULT_VAULT_WIDTH,
      commandQuery: "",
      vaultSearch: "",
      setVaultOpen: (open) => set({ vaultOpen: open }),
      toggleVault: () => set((s) => ({ vaultOpen: !s.vaultOpen })),
      setCommandOpen: (open) => set({ commandOpen: open }),
      setQuickEditArtistId: (id) => set({ quickEditArtistId: id }),
      setStatusFilter: (statusFilter) => set({ statusFilter }),
      setViewMode: (viewMode) => set({ viewMode }),
      setMobileBoardTab: (mobileBoardTab) => set({ mobileBoardTab }),
      setColumnOrder: (columnOrder) => set({ columnOrder }),
      moveColumn: (columnId, direction) => {
        const order = [...get().columnOrder];
        const idx = order.indexOf(columnId);
        if (idx < 0) return;
        const next = idx + direction;
        if (next < 0 || next >= order.length) return;
        [order[idx], order[next]] = [order[next], order[idx]];
        set({ columnOrder: order });
      },
      resizeAdjacentColumns: (left, right, deltaPct) => {
        const widths = { ...get().columnWidths };
        let newLeft = widths[left] + deltaPct;
        let newRight = widths[right] - deltaPct;
        newLeft = Math.min(MAX_COL_WIDTH, Math.max(MIN_COL_WIDTH, newLeft));
        newRight = Math.min(MAX_COL_WIDTH, Math.max(MIN_COL_WIDTH, newRight));
        const sum = newLeft + newRight;
        set({
          columnWidths: {
            ...widths,
            [left]: (newLeft / sum) * 100,
            [right]: (newRight / sum) * 100,
          },
        });
      },
      resizeVaultWidth: (deltaPct) => {
        const next = Math.min(
          MAX_VAULT_WIDTH,
          Math.max(MIN_VAULT_WIDTH, get().vaultWidthPct + deltaPct),
        );
        set({ vaultWidthPct: next });
      },
      setCommandQuery: (commandQuery) => set({ commandQuery }),
      setVaultSearch: (vaultSearch) => set({ vaultSearch }),
      setColumnSearch: (columnId, query) =>
        set((s) => ({
          columnSearch: { ...s.columnSearch, [columnId]: query },
        })),
      resetColumnLayout: () =>
        set({
          columnOrder: [...DEFAULT_BOARD_COLUMN_ORDER],
          columnWidths: { ...DEFAULT_BOARD_COLUMN_WIDTHS },
          vaultWidthPct: DEFAULT_VAULT_WIDTH,
        }),
    }),
    {
      name: "artist-ui",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        vaultOpen: state.vaultOpen,
        vaultWidthPct: state.vaultWidthPct,
        columnOrder: state.columnOrder,
        columnWidths: state.columnWidths,
        statusFilter: state.statusFilter,
        viewMode: state.viewMode,
        mobileBoardTab: state.mobileBoardTab,
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<UiState>;
        const columnOrder = migrateColumnOrder(p.columnOrder);
        const columnWidths = migrateColumnWidths(p.columnWidths, columnOrder);
        const mobileBoardTab =
          p.mobileBoardTab && columnOrder.includes(p.mobileBoardTab)
            ? p.mobileBoardTab
            : columnOrder[0] ?? "in_process";
        return {
          ...current,
          ...p,
          columnOrder,
          columnWidths,
          mobileBoardTab,
          columnSearch: current.columnSearch,
        };
      },
    },
  ),
);
