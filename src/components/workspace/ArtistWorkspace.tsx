"use client";

import { useCallback, useMemo, useState } from "react";
import { ArtistDetailPanel } from "./ArtistDetailPanel";
import { BulkActionsBar } from "./BulkActionsBar";
import { OdooAlertBanner } from "./OdooAlertBanner";
import { WorkspaceToolbar } from "./WorkspaceToolbar";
import { KanbanBoard } from "./kanban/KanbanBoard";
import type { KanbanColumnId } from "./kanban/constants";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useArtists } from "@/hooks/useArtists";
import { InstallPrompt } from "@/components/m3/InstallPrompt";
import { ServiceWorkerRegister } from "@/components/m3/ServiceWorkerRegister";
import type { Artist } from "@/lib/types";

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

  const debouncedSearch = useDebouncedValue(search, 150);
  const {
    artists,
    isLoading,
    stuckIds,
    createArtist,
    updateArtist,
    bulkUpdate,
    runCommand,
    isCommandPending,
  } = useArtists(debouncedSearch);

  const handlers = useMemo(() => {
    const set = new Set(artists.map((a) => a.handlerName).filter(Boolean));
    return [...set].sort((a, b) => a.localeCompare(b, "he"));
  }, [artists]);

  const odooPendingCount = useMemo(
    () => artists.filter((a) => a.isSigned && !a.isOdooApproved).length,
    [artists],
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
    async (ids: string[], columnId: KanbanColumnId) => {
      if (columnId === "stuck") {
        showToast("עמודת תקוע מזוהה אוטומטית ע״י AI — גרור לחתום או לא חתום");
        return;
      }
      const isSigned = columnId === "signed";
      try {
        await bulkUpdate({ ids, isSigned });
        showToast(`עודכנו ${ids.length} אומנים ל${isSigned ? "חתום" : "לא חתום"}`);
        setSelectedIds(new Set());
      } catch {
        showToast("עדכון סטטוס נכשל");
      }
    },
    [bulkUpdate],
  );

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
    patch: Partial<Pick<Artist, "name" | "handlerName" | "isSigned" | "isOdooApproved">>,
  ) => {
    if (!detailArtist) return;
    await updateArtist({ id: detailArtist.id, patch });
    showToast(`עודכן: ${patch.name ?? detailArtist.name}`);
  };

  return (
    <div className="workspace workspace--kanban">
      <ServiceWorkerRegister />
      <InstallPrompt />

      {offline && (
        <div className="odoo-alert" role="status">
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

      <div className="workspace__body">
        {isLoading ? (
          <div className="workspace__loading">טוען אומנים...</div>
        ) : (
          <KanbanBoard
            artists={artists}
            stuckIds={stuckIds}
            selectedIds={selectedIds}
            onToggleSelect={toggleSelected}
            onSetSelection={setSelection}
            onOpenDetail={setDetailArtist}
            onBulkStatusChange={handleBulkStatusChange}
          />
        )}
      </div>

      <BulkActionsBar
        selectedCount={selectedIds.size}
        handlers={handlers}
        onApplyStatus={(status) => {
          void handleBulkStatusChange([...selectedIds], status);
        }}
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
        className="workspace-fab"
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
        <div className="workspace-toast" role="status">
          {toast}
        </div>
      )}

      <ArtistDetailPanel
        artist={detailArtist}
        onClose={() => setDetailArtist(null)}
        onSave={handleSaveDetail}
      />
    </div>
  );
}
