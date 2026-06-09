"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type MouseEvent } from "react";
import { ArtistCreateModal } from "./ArtistCreateModal";
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
import { DesktopWorkspaceGrid } from "./DesktopWorkspaceGrid";
import { KanbanBoard } from "./kanban/KanbanBoard";
import { WorkspaceLoadingSkeleton } from "./WorkspaceLoadingSkeleton";
import { BottomNavItem, MobileShell } from "@/components/shell/MobileShell";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useArtists } from "@/hooks/useArtists";
import { useArtistsSync } from "@/hooks/useArtistsSync";
import { useFolders } from "@/hooks/useFolders";
import { InstallPrompt } from "@/components/m3/InstallPrompt";
import { ServiceWorkerRegister } from "@/components/m3/ServiceWorkerRegister";
import { countOdooPending } from "@/lib/artist-stats";
import { formatHebrewDateTime } from "@/lib/format";
import type { Artist, ArtistStatus } from "@/lib/types";
import { STATUS_META } from "@/lib/types";
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
  const [createOpen, setCreateOpen] = useState(false);
  const [odooBulkBusy, setOdooBulkBusy] = useState(false);
  const importRef = useRef<HTMLInputElement>(null);

  const statusFilter = useUiStore((s) => s.statusFilter);
  const viewMode = useUiStore((s) => s.viewMode);
  const setVaultOpen = useUiStore((s) => s.setVaultOpen);
  const toggleVault = useUiStore((s) => s.toggleVault);
  const setQuickEditArtistId = useUiStore((s) => s.setQuickEditArtistId);
  const setCommandOpen = useUiStore((s) => s.setCommandOpen);
  const setCommandQuery = useUiStore((s) => s.setCommandQuery);
  const quickEditId = useUiStore((s) => s.quickEditArtistId);
  const vaultOpen = useUiStore((s) => s.vaultOpen);

  useArtistsSync();

  const debouncedSearch = useDebouncedValue(search, 150);
  const {
    artists: allArtists,
    stats,
    cacheAt,
    isLoading,
    isError,
    error,
    refetch,
    createArtist,
    updateArtist,
    updateStatus,
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

  const odooPendingCount = useMemo(() => countOdooPending(allArtists), [allArtists]);

  const hideBoard = statusFilter === "unsigned";

  const boardArtistsCount = useMemo(
    () => artists.filter((a) => a.status === "in_process" || a.status === "signed").length,
    [artists],
  );

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCommandQuery(value);
  };

  const openCommandMenu = () => {
    setCommandQuery(search);
    setCommandOpen(true);
  };

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
      if (ids.length === 0) return;
      try {
        await updateStatus({ ids, status });
        showToast(`עודכנו ${ids.length} אומנים — ${STATUS_META[status].label}`);
        setSelectedIds(new Set());
      } catch (err) {
        showToast(err instanceof Error ? err.message : "עדכון סטטוס נכשל");
      }
    },
    [updateStatus],
  );

  const handleExportColumn = useCallback((status: ArtistStatus) => {
    const params = new URLSearchParams({ scope: "all", status });
    if (debouncedSearch) params.set("q", debouncedSearch);
    window.open(`/api/artists/export?${params}`, "_blank");
  }, [debouncedSearch]);

  const openArtist = (artist: Artist) => {
    setQuickEditArtistId(artist.id);
    setDetailArtist(artist);
  };

  const handleQuickCreate = () => {
    setCreateOpen(true);
  };

  const handleAddArtist = () => {
    setCreateOpen(true);
  };

  const handleCreateArtist = async (input: Parameters<typeof createArtist>[0]) => {
    const artist = await createArtist(input);
    showToast(`נוצר: ${artist.name}`);
  };

  const handleApproveAllOdoo = async () => {
    const pending = allArtists.filter((a) => a.status === "signed" && !a.isOdooApproved);
    if (pending.length === 0) return;
    const ok = window.confirm(`לאשר Odoo עבור ${pending.length} אומנים חתומים?`);
    if (!ok) return;
    setOdooBulkBusy(true);
    try {
      await bulkUpdate({ ids: pending.map((a) => a.id), isOdooApproved: true });
      showToast(`אושרו ${pending.length} אומנים ב-Odoo`);
    } catch {
      showToast("אישור Odoo נכשל");
    } finally {
      setOdooBulkBusy(false);
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
    try {
      const { status: newStatus, ...rest } = patch;
      if (newStatus !== undefined && newStatus !== detailArtist.status) {
        await updateStatus({ ids: [detailArtist.id], status: newStatus });
      }
      if (Object.keys(rest).length > 0) {
        await updateArtist({ id: detailArtist.id, patch: rest });
      }
      showToast(`עודכן: ${patch.name ?? detailArtist.name}`);
    } catch (err) {
      showToast(err instanceof Error ? err.message : "עדכון נכשל");
      throw err;
    }
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
      <BottomNavItem
        label="חיפוש"
        onClick={() => {
          setCommandQuery(search);
          setCommandOpen(true);
        }}
      />
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

      {isError && !offline && (
        <div
          className="flex flex-wrap items-center justify-center gap-2 border-b border-red-200 bg-red-50 px-4 py-2 text-center text-xs text-red-800"
          role="alert"
        >
          <span>
            טעינת אומנים נכשלה — {error instanceof Error ? error.message : "שגיאה לא ידועה"}
          </span>
          <button
            type="button"
            className="rounded-full bg-red-600 px-3 py-1 text-[10px] font-bold text-white hover:bg-red-700"
            onClick={() => void refetch()}
          >
            נסה שוב
          </button>
        </div>
      )}

      <div className="mx-auto flex h-full w-full max-w-[1600px] flex-col overflow-hidden">
        <WorkspaceToolbar
          operatorName={operatorName}
          search={search}
          onSearchChange={handleSearchChange}
          onOpenCommandMenu={openCommandMenu}
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

        <OdooAlertBanner
          count={odooPendingCount}
          onApproveAll={handleApproveAllOdoo}
          busy={odooBulkBusy}
        />

        {!isLoading && !isError && boardArtistsCount === 0 && vaultArtists.length > 0 && !vaultOpen && (
          <div className="mx-3 rounded-xl border border-cyan-200 bg-cyan-50 px-3 py-2 text-center text-[11px] text-cyan-900 md:mx-4">
            יש {vaultArtists.length} אומנים ב-Vault — לחץ Vault בתפריט התחתון
          </div>
        )}

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
                onClick={openCommandMenu}
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
          ) : viewMode === "list" ? (
              <div className="flex min-h-0 flex-1 gap-2 md:gap-4">
                <FoldersPanel
                  folders={folders}
                  activeFolderId={activeFolderId}
                  onSelectFolder={setActiveFolderId}
                  onCreateFolder={(name) => {
                    void createFolder(name).then(() => showToast(`נוצרה תיקייה: ${name}`));
                  }}
                />
                <ArtistsTable
                  artists={artists}
                  selectedIds={selectedIds}
                  onToggleSelect={toggleSelected}
                  onOpenDetail={openArtist}
                />
              </div>
            ) : (
              <>
                <div className="flex min-h-0 flex-1 flex-col lg:hidden">
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
                  <UnsignedVault
                    artists={vaultArtists}
                    selectedIds={selectedIds}
                    onToggleSelect={toggleSelected}
                    onOpenDetail={openArtist}
                  />
                </div>

                <DesktopWorkspaceGrid
                  artists={artists}
                  vaultArtists={vaultArtists}
                  hideBoard={hideBoard}
                  selectedIds={selectedIds}
                  onToggleSelect={toggleSelected}
                  onSetSelection={setSelection}
                  onOpenDetail={openArtist}
                  onBulkStatusChange={handleBulkStatusChange}
                  onExportColumn={handleExportColumn}
                  onContextMenu={handleContextMenu}
                  quickEditSlot={
                    <QuickEditPanel
                      artist={quickEditArtist}
                      handlers={handlers}
                      onSave={(id, patch) => {
                        void updateArtist({ id, patch });
                        showToast("נשמר");
                      }}
                    />
                  }
                />
              </>
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

      <ArtistCreateModal
        open={createOpen}
        operatorName={operatorName}
        handlers={handlers}
        onClose={() => setCreateOpen(false)}
        onCreate={handleCreateArtist}
      />

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
        onStatusChange={(id, status) => {
          void updateStatus({ ids: [id], status })
            .then(() => showToast(`סטטוס עודכן ל-${STATUS_META[status].label}`))
            .catch((err) =>
              showToast(err instanceof Error ? err.message : "עדכון סטטוס נכשל"),
            );
        }}
        onOdooChange={(id, approved) => {
          void updateArtist({ id, patch: { isOdooApproved: approved } });
          showToast(approved ? "אושר Odoo" : "בוטל Odoo");
        }}
        onOpenDetail={openArtist}
        onRunAi={async (cmd) => {
          try {
            const result = await runCommand(cmd);
            showToast(result.message);
          } catch (error) {
            showToast(error instanceof Error ? error.message : "פקודה נכשלה");
          }
        }}
      />
    </MobileShell>
  );
}
