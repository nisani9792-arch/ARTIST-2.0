import { create } from "zustand";

type UiState = {
  vaultOpen: boolean;
  commandOpen: boolean;
  quickEditArtistId: string | null;
  statusFilter: "all" | "signed" | "unsigned" | "in_process";
  setVaultOpen: (open: boolean) => void;
  toggleVault: () => void;
  setCommandOpen: (open: boolean) => void;
  setQuickEditArtistId: (id: string | null) => void;
  setStatusFilter: (filter: UiState["statusFilter"]) => void;
};

export const useUiStore = create<UiState>((set) => ({
  vaultOpen: false,
  commandOpen: false,
  quickEditArtistId: null,
  statusFilter: "all",
  setVaultOpen: (open) => set({ vaultOpen: open }),
  toggleVault: () => set((s) => ({ vaultOpen: !s.vaultOpen })),
  setCommandOpen: (open) => set({ commandOpen: open }),
  setQuickEditArtistId: (id) => set({ quickEditArtistId: id }),
  setStatusFilter: (statusFilter) => set({ statusFilter }),
}));
