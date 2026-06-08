"use client";

import { useCallback, useRef } from "react";

type ColumnResizeHandleProps = {
  onResize: (deltaPx: number) => void;
};

export function ColumnResizeHandle({ onResize }: ColumnResizeHandleProps) {
  const startX = useRef(0);

  const onPointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      const el = event.currentTarget;
      const pointerId = event.pointerId;
      startX.current = event.clientX;
      el.setPointerCapture(pointerId);

      const onMove = (ev: PointerEvent) => {
        const delta = ev.clientX - startX.current;
        startX.current = ev.clientX;
        onResize(delta);
      };

      const onUp = () => {
        el.releasePointerCapture(pointerId);
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [onResize],
  );

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label="שינוי רוחב עמודה"
      onPointerDown={onPointerDown}
      className="group hidden w-3 shrink-0 cursor-col-resize touch-none items-center justify-center md:flex"
    >
      <div className="h-12 w-1 rounded-full bg-slate-200 transition group-hover:bg-blue-400 group-active:bg-blue-600" />
    </div>
  );
}
