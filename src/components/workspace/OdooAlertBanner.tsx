"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

type OdooAlertBannerProps = {
  count: number;
  onApproveAll?: () => void;
  busy?: boolean;
};

export function OdooAlertBanner({ count, onApproveAll, busy }: OdooAlertBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  const [pulse, setPulse] = useState(true);

  useEffect(() => {
    if (count <= 0) {
      setDismissed(false);
      return;
    }
    const timer = window.setTimeout(() => setPulse(false), 2400);
    return () => window.clearTimeout(timer);
  }, [count]);

  if (count <= 0 || dismissed) return null;

  return (
    <div
      className={cn(
        "relative overflow-hidden border-b border-amber-200/60",
        "bg-gradient-to-r from-amber-50 via-white to-emerald-50/40",
        pulse && "animate-[pulse_2s_ease-in-out_1]",
      )}
      role="alert"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_50%,rgba(251,191,36,0.15),transparent_50%)]" />
      <div className="relative mx-auto flex max-w-[1600px] flex-wrap items-center gap-3 px-4 py-3">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400 to-amber-500 text-sm text-white shadow-md">
          !
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-extrabold text-slate-900">
            {count.toLocaleString("he-IL")} אומנים חתומים ממתינים לאישור Odoo
          </p>
          <p className="text-[11px] text-slate-600">
            מומלץ לאשר כדי לסנכרן את הלוח עם המערכת — ניתן גם לבחור כמה ולאשר בבת אחת
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {onApproveAll && (
            <button
              type="button"
              className="rounded-full bg-gradient-to-r from-emerald-600 to-emerald-500 px-4 py-2 text-xs font-bold text-white shadow-md transition hover:shadow-lg disabled:opacity-50"
              disabled={busy}
              onClick={onApproveAll}
            >
              {busy ? "מאשר…" : "אשר את כולם"}
            </button>
          )}
          <button
            type="button"
            className="rounded-full border border-slate-200/80 bg-white/80 px-3 py-2 text-[10px] font-bold text-slate-500 backdrop-blur-sm hover:bg-white"
            onClick={() => setDismissed(true)}
          >
            הסתר
          </button>
        </div>
      </div>
    </div>
  );
}
