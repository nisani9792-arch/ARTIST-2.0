"use client";

import { useCallback, useMemo, useState } from "react";
import { ArtistDetailPanel } from "./ArtistDetailPanel";
import { BulkActionsBar } from "./BulkActionsBar";
import { CommandMenu } from "./CommandMenu";
import { OdooAlertBanner } from "./OdooAlertBanner";
import { QuickEditPanel } from "./QuickEditPanel";
import { StatusFilterPills } from "./StatusFilterPills";
import { StatusProgressBar } from "./StatusProgressBar";
import { UnsignedVault } from "./UnsignedVault";
import { WorkspaceToolbar } from "./WorkspaceToolbar";
import { KanbanBoard } from "./kanban/KanbanBoard";
import { WorkspaceLoadingSkeleton } from "./WorkspaceLoadingSkeleton";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useArtists } from "@/hooks/useArtists";
import { InstallPrompt } from "@/components/m3/InstallPrompt";
import { ServiceWorkerRegister } from "@/components/m3/ServiceWorkerRegister";
import type { Artist, ArtistStatus } from "@/lib/types";
import { useUiStore } from "@/stores";

type ArtistWorkspaceProps = {
  operatorName?: string | null;
  offline?: boolean;
};

export function ArtistWorkspace({ operatorName, offline }: ArtistWorkspaceProps) {
  const [search, setSearch] = useState("");
  const [quickName, setQuickName] = useState("");
  const [aiCommand, setAiCommand] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [detailArtist, setDetailArtist] = useState<Artist | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const statusFilter = useUiStore((s) => s.statusFilter);
  const setQuickEditArtistId = useUiStore((s) => s.setQuickEditArtistId);
  const setCommandOpen = useUiStore((s) => s.setCommandOpen);
  const quickEditId = useUiStore((s) => s.quickEditArtistId);

  const debouncedSearch = useDebouncedValue(search, 150);
  const {
    artists: allArtists,
    stats,
    isLoading,
    createArtist,
    updateArtist,
    bulkUpdate,
    runCommand,
    isCommandPending,
  } = useArtists(debouncedSearch);

  const artists = useMemo(() => {
    if (statusFilter === "all") return allArtists;
    return allArtists.filter((a) => a.status === statusFilter);
  }, [allArtists, statusFilter]);

  const vaultArtists = useMemo(
    () => artists.filter((a) => a.status === "unsigned"),
    [artists],
  );

  const quickEditArtist = useMemo(
    () => (quickEditId ? artists.find((a) => a.id === quickEditId) ?? null : null),
    [artists, quickEditId],
  );

  const handlers = useMemo(() => {
    const set = new Set(allArtists.map((a) => a.handlerName).filter(Boolean));
    return [...set].sort((a, b) => a.localeCompare(b, "he"));
  }, [allArtists]);

  const odooPendingCount = useMemo(
    () => allArtists.filter((a) => a.status === "signed" && !a.isOdooApproved).length,
    [allArtists],
  );

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 3200);
  };

  const toggleSelected = useCallback((artistId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(artistId)) next.delete(artistId);
      else next.add(artistId);
      return next;
    });
  }, []);

  const setSelection = useCallback((ids: string[]) => {
    setSelectedIds(new Set(ids));
  }, []);

  const selectAllFiltered = useCallback(() => {
    if (artists.length === 0) return;
    if (artists.length > 500) {
      const ok = window.confirm(`לבחור את כל ${artists.length} האומנים המוצגים?`);
      if (!ok) return;
    }
    setSelectedIds(new Set(artists.map((a) => a.id)));
    showToast(`נבחרו ${artists.length} אומנים`);
  }, [artists]);

  const handleBulkStatusChange = useCallback(
    async (ids: string[], status: ArtistStatus) => {
      try {
        await bulkUpdate({ ids, status });
        showToast(`עודכנו ${ids.length} אומנים`);
        setSelectedIds(new Set());
      } catch {
        showToast("עדכון סטטוס נכשל");
      }
    },
    [bulkUpdate],
  );

  const openArtist = (artist: Artist) => {
    setQuickEditArtistId(artist.id);
    setDetailArtist(artist);
  };

  const handleQuickCreate = async () => {
    const name = quickName.trim();
    if (!name) return;
    try {
      await createArtist(name);
      setQuickName("");
      showToast(`נוצר: ${name}`);
    } catch {
      showToast("יצירה נכשלה");
    }
  };

  const handleAiSubmit = async () => {
    const cmd = aiCommand.trim();
    if (!cmd) return;
    try {
      const result = await runCommand(cmd);
      setAiCommand("");
      showToast(result.message);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "פקודה נכשלה");
    }
  };

  const handleSaveDetail = async (
    patch: Partial<Pick<Artist, "name" | "handlerName" | "status" | "isOdooApproved">>,
  ) => {
    if (!detailArtist) return;
    await updateArtist({ id: detailArtist.id, patch });
    showToast(`עודכן: ${patch.name ?? detailArtist.name}`);
  };

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-zinc-50 font-sans">
      <ServiceWorkerRegister />
      <InstallPrompt />

      {offline && (
        <div
          className="border-b border-slate-200 bg-slate-100 px-4 py-2 text-center text-xs text-slate-600"
          role="status"
        >
          מצב לא מקוון — עבודה עם נתונים שמורים במכשיר
        </div>
      )}

      <WorkspaceToolbar
        operatorName={operatorName}
        search={search}
        onSearchChange={setSearch}
        quickName={quickName}
        onQuickNameChange={setQuickName}
        onQuickCreate={handleQuickCreate}
        aiCommand={aiCommand}
        onAiCommandChange={setAiCommand}
        onAiSubmit={handleAiSubmit}
        isAiPending={isCommandPending}
        totalCount={artists.length}
        selectedCount={selectedIds.size}
        onSelectAll={selectAllFiltered}
        onClearSelection={() => setSelectedIds(new Set())}
      />

      <OdooAlertBanner count={odooPendingCount} />

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden p-4">
        <StatusProgressBar stats={stats} />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <StatusFilterPills stats={stats} />
          <button
            type="button"
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 shadow-sm transition hover:border-blue-300 hover:text-blue-700"
            onClick={() => setCommandOpen(true)}
          >
            חיפוש מהיר (Ctrl+K)
          </button>
        </div>

        {isLoading ? (
          <WorkspaceLoadingSkeleton />
        ) : (
          <div className="flex min-h-0 flex-1 gap-4">
            <div className="flex min-h-0 min-w-0 flex-1">
              <KanbanBoard
                artists={artists}
                selectedIds={selectedIds}
                onToggleSelect={toggleSelected}
                onSetSelection={setSelection}
                onOpenDetail={openArtist}
                onBulkStatusChange={handleBulkStatusChange}
              />
            </div>
            <UnsignedVault
              artists={vaultArtists}
              selectedIds={selectedIds}
              onToggleSelect={toggleSelected}
              onOpenDetail={openArtist}
            />
            <QuickEditPanel
              artist={quickEditArtist}
              handlers={handlers}
              onSave={(id, patch) => {
                void updateArtist({ id, patch });
                showToast("נשמר");
              }}
            />
          </div>
        )}
      </div>

      <BulkActionsBar
        selectedCount={selectedIds.size}
        handlers={handlers}
        onApplyStatus={(status) => void handleBulkStatusChange([...selectedIds], status)}
        onApplyHandler={async (handler) => {
          try {
            await bulkUpdate({ ids: [...selectedIds], handlerName: handler });
            showToast(`עודכנו ${selectedIds.size} אומנים`);
            setSelectedIds(new Set());
          } catch {
            showToast("עדכון מטפל נכשל");
          }
        }}
        onClearSelection={() => setSelectedIds(new Set())}
      />

      <button
        type="button"
        className={`fixed end-4 z-40 flex size-12 items-center justify-center rounded-full bg-blue-600 text-2xl font-bold text-white shadow-lg transition hover:-translate-y-0.5 hover:bg-blue-700 hover:shadow-xl ${
          selectedIds.size > 0 ? "bottom-24" : "bottom-20"
        }`}
        aria-label="הוסף אומן"
        onClick={() => {
          const name = window.prompt("שם אומן חדש:");
          if (name?.trim()) {
            createArtist(name.trim())
              .then(() => showToast(`נוצר: ${name.trim()}`))
              .catch(() => showToast("יצירה נכשלה"));
          }
        }}
      >
        +
      </button>

      {toast && (
        <div
          className={`fixed end-4 z-[60] rounded-2xl border border-slate-200 bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-lg ${
            selectedIds.size > 0 ? "bottom-28" : "bottom-4"
          }`}
          role="status"
        >
          {toast}
        </div>
      )}

      <ArtistDetailPanel
        artist={detailArtist}
        onClose={() => setDetailArtist(null)}
        onSave={handleSaveDetail}
      />

      <CommandMenu
        artists={allArtists}
        onStatusChange={(id, status) => void handleBulkStatusChange([id], status)}
        onOpenDetail={openArtist}
      />
    </div>
  );
}
