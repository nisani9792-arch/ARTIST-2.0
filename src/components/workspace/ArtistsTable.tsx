"use client";

import { formatHebrewDateTime } from "@/lib/format";
import { cn } from "@/lib/cn";
import { STATUS_META, type Artist } from "@/lib/types";

type ArtistsTableProps = {
  artists: Artist[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onOpenDetail: (artist: Artist) => void;
};

export function ArtistsTable({
  artists,
  selectedIds,
  onToggleSelect,
  onOpenDetail,
}: ArtistsTableProps) {
  return (
    <div className="kanban-scroll min-h-0 flex-1 overflow-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full min-w-[640px] border-collapse text-start text-[11px]">
        <thead className="sticky top-0 z-10 bg-slate-50 text-[10px] font-bold text-gray-500">
          <tr>
            <th className="w-8 p-2" />
            <th className="p-2">שם</th>
            <th className="p-2">סטטוס</th>
            <th className="p-2">מטפל</th>
            <th className="p-2">תגית</th>
            <th className="p-2">Odoo</th>
            <th className="p-2">שירים</th>
            <th className="p-2">עודכן</th>
          </tr>
        </thead>
        <tbody>
          {artists.length === 0 ? (
            <tr>
              <td colSpan={8} className="p-8 text-center text-gray-500">
                אין אומנים להצגה
              </td>
            </tr>
          ) : (
            artists.map((artist) => (
              <tr
                key={artist.id}
                className={cn(
                  "cursor-pointer border-t border-slate-100 transition hover:bg-slate-50",
                  selectedIds.has(artist.id) && "bg-blue-50/60",
                )}
                onClick={() => onOpenDetail(artist)}
              >
                <td className="p-2" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedIds.has(artist.id)}
                    onChange={() => onToggleSelect(artist.id)}
                    className="size-3.5 rounded accent-cyan-600"
                  />
                </td>
                <td className="p-2 font-bold text-slate-900">{artist.name}</td>
                <td className="p-2">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold">
                    {STATUS_META[artist.status].label}
                  </span>
                </td>
                <td className="p-2 text-gray-500">{artist.handlerName}</td>
                <td className="p-2 text-gray-500">{artist.tag || "—"}</td>
                <td className="p-2">{artist.isOdooApproved ? "✓" : "—"}</td>
                <td className="p-2">{artist.songCount || "—"}</td>
                <td className="p-2 text-gray-500">
                  {formatHebrewDateTime(artist.lastActionTimestamp)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
