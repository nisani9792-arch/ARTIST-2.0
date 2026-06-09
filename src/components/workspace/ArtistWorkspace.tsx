"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { ArtistDetailPanel } from "./ArtistDetailPanel";
import { ArtistContextMenu } from "./ArtistContextMenu";
import { ArtistsTable } from "./ArtistsTable";
import { BulkActionsBar } from "./BulkActionsBar";
import { CommandMenu } from "./CommandMenu";
import { FoldersPanel } from "./FoldersPanel";
import { OdooAlertBanner } from "./OdooAlertBanner";
import { QuickEditPanel } from "./QuickEditPanel";
import { StatusFilterPills } from "./StatusFilterPills";
import { StatusProgressBar } from "./StatusProgressBar";
import { TrashPanel } from "./TrashPanel";
import { UnsignedVault } from "./UnsignedVault";
import { ViewModeSwitcher } from "./ViewModeSwitcher";
import { WorkspaceToolbar } from "./WorkspaceToolbar";
import { KanbanBoard } from "./kanban/KanbanBoard";
import { WorkspaceLoadingSkeleton } from "./WorkspaceLoadingSkeleton";
import { BottomNavItem, MobileShell } from "@/components/shell/MobileShell";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useArtists } from "@/hooks/useArtists";
import { useArtistsSync } from "@/hooks/useArtistsSync";
import { useFolders } from "@/hooks/useFolders";
import { InstallPrompt } from "@/components/m3/InstallPrompt";
import { ServiceWorkerRegister } from "@/components/m3/ServiceWorkerRegister";
import { formatHebrewDateTime } from "@/lib/format";
import type { Artist, ArtistStatus } from "@/lib/types";
import { useUiStore } from "@/stores";

type ArtistWorkspaceProps = {
  operatorName?: string | null;
  offline?: boolean;
  degraded?: boolean;
};

export function ArtistWorkspace({ operatorName, offline, degraded }: ArtistWorkspaceProps) {
  const [search, setSearch] = useState("");
  const [quickName, setQuickName] = useState("");
  const [aiCommand, setAiCommand] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [detailArtist, setDetailArtist] = useState<Artist | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [trashOpen, setTrashOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState<{
    artist: Artist;
    position: { x: number; y: number };
  } | null>(null);
  const importRef = useRef<HTMLInputElement>(null);

  const statusFilter = useUiStore((s) => s.statusFilter);
  const viewMode = useUiStore((s) => s.viewMode);
  const setVaultOpen = useUiStore((s) => s.setVaultOpen);
  const toggleVault = useUiStore((s) => s.toggleVault);
  const setQuickEditArtistId = useUiStore((s) => s.setQuickEditArtistId);
  const setCommandOpen = useUiStore((s) => s.setCommandOpen);
  const quickEditId = useUiStore((s) => s.quickEditArtistId);
  const vaultOpen = useUiStore((s) => s.vaultOpen);

  useArtistsSync();

  const debouncedSearch = useDebouncedValue(search, 150);
  const {
    artists: allArtists,
    stats,
    cacheAt,
    isLoading,
    createArtist,
    updateArtist,
    deleteArtist,
    bulkUpdate,
    runCommand,
    isCommandPending,
  } = useArtists(debouncedSearch);

  const { folders, createFolder } = useFolders();

  useEffect(() => {
    if (statusFilter === "unsigned") {
      setVaultOpen(true);
    }
  }, [statusFilter, setVaultOpen]);

  const artists = useMemo(() => {
    let list = allArtists;
    if (statusFilter !== "all") {
      list = list.filter((a) => a.status === statusFilter);
    }
    if (activeFolderId) {
      list = list.filter((a) => a.folderId === activeFolderId);
    }
    return list;
  }, [allArtists, statusFilter, activeFolderId]);

  const vaultArtists = useMemo(
    () => allArtists.filter((a) => a.status === "unsigned"),
    [allArtists],
  );

  const quickEditArtist = useMemo(
    () => (quickEditId ? allArtists.find((a) => a.id === quickEditId) ?? null : null),
    [allArtists, quickEditId],
  );

  const handlers = useMemo(() => {
    const set = new Set(allArtists.map((a) => a.handlerName).filter(Boolean));
    return [...set].sort((a, b) => a.localeCompare(b, "he"));
  }, [allArtists]);

  const odooPendingCount = useMemo(
    () => allArtists.filter((a) => a.status === "signed" && !a.isOdooApproved).length,
    [allArtists],
  );

  const hideBoard = statusFilter === "unsigned";

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

  const handleAddArtist = () => {
    const name = window.prompt("שם אומן חדש:");
    if (name?.trim()) {
      createArtist(name.trim())
        .then(() => showToast(`נוצר: ${name.trim()}`))
        .catch(() => showToast("יצירה נכשלה"));
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

  const handleBulkOdoo = useCallback(
    async (approved: boolean) => {
      try {
        await bulkUpdate({ ids: [...selectedIds], isOdooApproved: approved });
        showToast(`עודכנו ${selectedIds.size} אומנים — Odoo`);
        setSelectedIds(new Set());
      } catch {
        showToast("עדכון Odoo נכשל");
      }
    },
    [bulkUpdate, selectedIds],
  );

  const handleBulkSongCount = useCallback(
    async (count: number) => {
      try {
        await bulkUpdate({ ids: [...selectedIds], songCount: count });
        showToast(`עודכנו כמות שירים ל-${count} עבור ${selectedIds.size} אומנים`);
        setSelectedIds(new Set());
      } catch {
        showToast("עדכון כמות שירים נכשל");
      }
    },
    [bulkUpdate, selectedIds],
  );

  const handleSaveDetail = async (
    patch: Partial<
      Pick<
        Artist,
        "name" | "handlerName" | "status" | "isOdooApproved" | "songCount" | "email" | "notes" | "tag"
      >
    >,
  ) => {
    if (!detailArtist) return;
    await updateArtist({ id: detailArtist.id, patch });
    showToast(`עודכן: ${patch.name ?? detailArtist.name}`);
  };

  const handleContextMenu = (artist: Artist, event: MouseEvent) => {
    setContextMenu({ artist, position: { x: event.clientX, y: event.clientY } });
  };

  const handleExport = () => {
    const scope = selectedIds.size > 0 ? "selected" : "all";
    const params = new URLSearchParams({ scope });
    if (scope === "selected") params.set("ids", [...selectedIds].join(","));
    if (debouncedSearch) params.set("q", debouncedSearch);
    window.open(`/api/artists/export?${params}`, "_blank");
  };

  const handleImport = async (file: File) => {
    try {
      const res = await fetch("/api/artists/import", {
        method: "POST",
        headers: { "Content-Type": "text/csv" },
        body: await file.text(),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "ייבוא נכשל");
      showToast(`יובאו ${data.created} אומנים חדשים`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : "ייבוא נכשל");
    }
  };

  const bottomNav = (
    <div className="flex items-stretch">
      <BottomNavItem
        label="לוח"
        active={!vaultOpen}
        onClick={() => setVaultOpen(false)}
      />
      <BottomNavItem
        label="Vault"
        active={vaultOpen}
        badge={vaultArtists.length}
        onClick={toggleVault}
      />
      <BottomNavItem label="חיפוש" onClick={() => setCommandOpen(true)} />
      <BottomNavItem label="הוסף" onClick={handleAddArtist} />
    </div>
  );

  return (
    <MobileShell bottomNav={bottomNav}>
      <ServiceWorkerRegister />
      <InstallPrompt />

      {offline && (
        <div
          className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs text-amber-800"
          role="status"
        >
          אין חיבור לאינטרנט — מציגים נתונים שמורים
          {cacheAt && ` (עודכנו ${formatHebrewDateTime(cacheAt)})`}
        </div>
      )}

      {degraded && !offline && (
        <div
          className="border-b border-slate-200 bg-slate-100 px-4 py-2 text-center text-xs text-slate-600"
          role="status"
        >
          חיבור לשרת איטי — ממשיכים עם נתונים שמורים
          {cacheAt && ` (עודכנו ${formatHebrewDateTime(cacheAt)})`}
        </div>
      )}

      <div className="mx-auto flex h-full w-full max-w-[1600px] flex-col overflow-hidden">
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

        <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden p-3 md:gap-4 md:p-4">
          <StatusProgressBar stats={stats} />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <StatusFilterPills stats={stats} />
            <div className="flex flex-wrap items-center gap-2">
              <ViewModeSwitcher />
              <button
                type="button"
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-bold text-slate-600 shadow-sm hover:border-blue-300"
                onClick={handleExport}
              >
                ייצוא CSV
              </button>
              <button
                type="button"
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-bold text-slate-600 shadow-sm hover:border-blue-300"
                onClick={() => importRef.current?.click()}
              >
                ייבוא CSV
              </button>
              <button
                type="button"
                className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[10px] font-bold text-slate-600 shadow-sm hover:border-blue-300"
                onClick={() => setTrashOpen(true)}
              >
                סל מחזור
              </button>
              <button
                type="button"
                className="hidden rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-600 shadow-sm transition hover:border-blue-300 hover:text-blue-700 sm:inline-flex"
                onClick={() => setCommandOpen(true)}
              >
                חיפוש מהיר (Ctrl+K)
              </button>
            </div>
          </div>

          <input
            ref={importRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void handleImport(file);
              e.target.value = "";
            }}
          />

          {isLoading ? (
            <WorkspaceLoadingSkeleton />
          ) : (
            <div className="flex min-h-0 flex-1 gap-2 md:gap-4">
              <FoldersPanel
                folders={folders}
                activeFolderId={activeFolderId}
                onSelectFolder={setActiveFolderId}
                onCreateFolder={(name) => {
                  void createFolder(name).then(() => showToast(`נוצרה תיקייה: ${name}`));
                }}
              />

              <div className="flex min-h-0 min-w-0 flex-1 flex-col">
                {viewMode === "list" ? (
                  <ArtistsTable
                    artists={artists}
                    selectedIds={selectedIds}
                    onToggleSelect={toggleSelected}
                    onOpenDetail={openArtist}
                  />
                ) : (
                  <KanbanBoard
                    artists={artists}
                    selectedIds={selectedIds}
                    onToggleSelect={toggleSelected}
                    onSetSelection={setSelection}
                    onOpenDetail={openArtist}
                    onBulkStatusChange={handleBulkStatusChange}
                    onContextMenu={handleContextMenu}
                    hideBoard={hideBoard}
                  />
                )}
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
          onApplyOdoo={(approved) => void handleBulkOdoo(approved)}
          onApplySongCount={(count) => void handleBulkSongCount(count)}
          onClearSelection={() => setSelectedIds(new Set())}
        />
      </div>

      {toast && (
        <div
          className={`fixed end-4 z-[60] rounded-2xl border border-slate-200 bg-slate-900 px-4 py-2.5 text-sm font-medium text-white shadow-lg ${
            selectedIds.size > 0 ? "bottom-28 lg:bottom-4" : "bottom-20 lg:bottom-4"
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

      <ArtistContextMenu
        artist={contextMenu?.artist ?? null}
        position={contextMenu?.position ?? null}
        operatorName={operatorName}
        onClose={() => setContextMenu(null)}
        onOpenDetail={openArtist}
        onToggleOdoo={(artist) => {
          void updateArtist({ id: artist.id, patch: { isOdooApproved: !artist.isOdooApproved } });
          showToast("עודכן Odoo");
        }}
        onAssignMe={(artist) => {
          if (!operatorName) return;
          void updateArtist({ id: artist.id, patch: { handlerName: operatorName } });
          showToast(`שויך ל-${operatorName}`);
        }}
        onStatusChange={(artist, status) => void handleBulkStatusChange([artist.id], status)}
        onMoveToTrash={(artist) => {
          void deleteArtist(artist.id).then(() => showToast(`${artist.name} הועבר לסל מחזור`));
        }}
      />

      <TrashPanel
        open={trashOpen}
        onClose={() => setTrashOpen(false)}
        onRestore={async (id) => {
          await updateArtist({ id, patch: { deletedAt: null } });
          showToast("אומן שוחזר");
        }}
      />

      <CommandMenu
        artists={allArtists}
        onStatusChange={(id, status) => void handleBulkStatusChange([id], status)}
        onOpenDetail={openArtist}
      />
    </MobileShell>
  );
}
