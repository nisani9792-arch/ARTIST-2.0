import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { ArtistStatus } from "@/lib/types";

export type BoardColumnStatus = Extract<ArtistStatus, "in_process" | "signed">;
export type ViewMode = "kanban" | "list";

const DEFAULT_ORDER: BoardColumnStatus[] = ["in_process", "signed"];
const DEFAULT_WIDTHS: Record<BoardColumnStatus, number> = {
  in_process: 50,
  signed: 50,
};
const MIN_COL_WIDTH = 22;
const MAX_COL_WIDTH = 78;

type UiState = {
  vaultOpen: boolean;
  commandOpen: boolean;
  quickEditArtistId: string | null;
  statusFilter: "all" | "signed" | "unsigned" | "in_process";
  viewMode: ViewMode;
  mobileBoardTab: BoardColumnStatus;
  columnOrder: BoardColumnStatus[];
  columnWidths: Record<BoardColumnStatus, number>;
  setVaultOpen: (open: boolean) => void;
  toggleVault: () => void;
  setCommandOpen: (open: boolean) => void;
  setQuickEditArtistId: (id: string | null) => void;
  setStatusFilter: (filter: UiState["statusFilter"]) => void;
  setViewMode: (mode: ViewMode) => void;
  setMobileBoardTab: (tab: BoardColumnStatus) => void;
  setColumnOrder: (order: BoardColumnStatus[]) => void;
  moveColumn: (status: BoardColumnStatus, direction: -1 | 1) => void;
  resizeAdjacentColumns: (
    left: BoardColumnStatus,
    right: BoardColumnStatus,
    deltaPct: number,
  ) => void;
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
      columnOrder: DEFAULT_ORDER,
      columnWidths: DEFAULT_WIDTHS,
      setVaultOpen: (open) => set({ vaultOpen: open }),
      toggleVault: () => set((s) => ({ vaultOpen: !s.vaultOpen })),
      setCommandOpen: (open) => set({ commandOpen: open }),
      setQuickEditArtistId: (id) => set({ quickEditArtistId: id }),
      setStatusFilter: (statusFilter) => set({ statusFilter }),
      setViewMode: (viewMode) => set({ viewMode }),
      setMobileBoardTab: (mobileBoardTab) => set({ mobileBoardTab }),
      setColumnOrder: (columnOrder) => set({ columnOrder }),
      moveColumn: (status, direction) => {
        const order = [...get().columnOrder];
        const idx = order.indexOf(status);
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
      resetColumnLayout: () =>
        set({ columnOrder: DEFAULT_ORDER, columnWidths: DEFAULT_WIDTHS }),
    }),
    {
      name: "artist-ui",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        vaultOpen: state.vaultOpen,
        columnOrder: state.columnOrder,
        columnWidths: state.columnWidths,
        statusFilter: state.statusFilter,
        viewMode: state.viewMode,
        mobileBoardTab: state.mobileBoardTab,
      }),
    },
  ),
);
