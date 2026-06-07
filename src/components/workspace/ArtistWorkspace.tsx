"use client";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useMemo, useRef, useState } from "react";
import { ArtistZone } from "./ArtistZone";
import { BulkActionsBar } from "./BulkActionsBar";
import { OdooAlertBanner } from "./OdooAlertBanner";
import { WorkspaceTopBar } from "./WorkspaceTopBar";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { useArtists } from "@/hooks/useArtists";
import { ArtistCard } from "@/components/artist/ArtistCard";
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
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeArtist, setActiveArtist] = useState<Artist | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const anchorIdRef = useRef<string | null>(null);

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

  const unsigned = useMemo(() => artists.filter((a) => !a.isSigned), [artists]);
  const signed = useMemo(() => artists.filter((a) => a.isSigned), [artists]);
  const odooPendingCount = useMemo(
    () => artists.filter((a) => a.isSigned && !a.isOdooApproved).length,
    [artists],
  );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(null), 3200);
  };

  const handleSelect = (zoneArtists: Artist[], artist: Artist, event: React.MouseEvent) => {
    if (!selectionMode) return;

    if (event.shiftKey && anchorIdRef.current) {
      const ids = zoneArtists.map((a) => a.id);
      const start = ids.indexOf(anchorIdRef.current);
      const end = ids.indexOf(artist.id);
      if (start !== -1 && end !== -1) {
        const [from, to] = start < end ? [start, end] : [end, start];
        const range = ids.slice(from, to + 1);
        setSelectedIds((prev) => new Set([...prev, ...range]));
        return;
      }
    }

    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(artist.id)) next.delete(artist.id);
      else next.add(artist.id);
      return next;
    });
    anchorIdRef.current = artist.id;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const artist = event.active.data.current?.artist as Artist | undefined;
    if (artist) setActiveArtist(artist);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveArtist(null);
    const artist = event.active.data.current?.artist as Artist | undefined;
    const overId = event.over?.id;
    if (!artist || !overId) return;

    const targetSigned = overId === "signed";
    const targetUnsigned = overId === "unsigned";
    if (!targetSigned && !targetUnsigned) return;
    if (artist.isSigned === targetSigned) return;

    try {
      await updateArtist({
        id: artist.id,
        patch: { isSigned: targetSigned },
      });
    } catch {
      showToast("עדכון סטטוס נכשל");
    }
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

  const handleOdooToggle = async (artist: Artist, approved: boolean) => {
    try {
      await updateArtist({ id: artist.id, patch: { isOdooApproved: approved } });
    } catch {
      showToast("עדכון אישור אודו נכשל");
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

  return (
    <div className="workspace">
      <ServiceWorkerRegister />
      <InstallPrompt />
      {offline && (
        <div className="odoo-alert" role="status">
          מצב לא מקוון — עבודה עם נתונים שמורים במכשיר
        </div>
      )}

      <WorkspaceTopBar
        operatorName={operatorName}
        search={search}
        onSearchChange={setSearch}
        quickName={quickName}
        onQuickNameChange={setQuickName}
        onQuickCreate={handleQuickCreate}
        aiCommand={aiCommand}
        onAiCommandChange={setAiCommand}
        onAiSubmit={handleAiSubmit}
        selectionMode={selectionMode}
        onToggleSelectionMode={() => {
          setSelectionMode((v) => !v);
          if (selectionMode) setSelectedIds(new Set());
        }}
        isAiPending={isCommandPending}
      />

      <OdooAlertBanner count={odooPendingCount} />

      {isLoading ? (
        <div className="workspace__loading">טוען אומנים...</div>
      ) : (
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="workspace__zones">
            <ArtistZone
              zoneId="unsigned"
              title="לא חתומים"
              icon="📁"
              artists={unsigned}
              selectedIds={selectedIds}
              selectionMode={selectionMode}
              stuckIds={stuckIds}
              onSelect={(artist, event) => handleSelect(unsigned, artist, event)}
              onOdooToggle={handleOdooToggle}
            />
            <ArtistZone
              zoneId="signed"
              title="חתומים"
              icon="✓"
              artists={signed}
              selectedIds={selectedIds}
              selectionMode={selectionMode}
              stuckIds={stuckIds}
              onSelect={(artist, event) => handleSelect(signed, artist, event)}
              onOdooToggle={handleOdooToggle}
            />
          </div>

          <DragOverlay>
            {activeArtist ? (
              <ArtistCard
                artist={activeArtist}
                selected={false}
                selectionMode={false}
                isStuck={stuckIds.has(activeArtist.id)}
                onSelect={() => {}}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      )}

      <BulkActionsBar
        count={selectedIds.size}
        onClear={() => setSelectedIds(new Set())}
        onApplyHandler={async (handler) => {
          try {
            await bulkUpdate({ ids: [...selectedIds], handlerName: handler });
            showToast(`עודכנו ${selectedIds.size} אומנים`);
            setSelectedIds(new Set());
          } catch {
            showToast("עדכון מרובה נכשל");
          }
        }}
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
    </div>
  );
}
