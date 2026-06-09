"use client";

type OdooAlertBannerProps = {
  count: number;
  onApproveAll?: () => void;
  busy?: boolean;
};

export function OdooAlertBanner({ count, onApproveAll, busy }: OdooAlertBannerProps) {
  if (count <= 0) return null;

  return (
    <div
      className="flex flex-wrap items-center gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900"
      role="alert"
    >
      <span className="size-2 shrink-0 rounded-full bg-amber-500" aria-hidden />
      <span className="min-w-0 flex-1">
        יש <strong className="font-bold">{count}</strong> אומנים חתומים שצריך לאשר באודו
      </span>
      {onApproveAll && (
        <button
          type="button"
          className="shrink-0 rounded-full bg-emerald-600 px-3 py-1 text-[10px] font-bold text-white hover:bg-emerald-700 disabled:opacity-50"
          disabled={busy}
          onClick={onApproveAll}
        >
          {busy ? "מאשר…" : "אשר את כולם"}
        </button>
      )}
    </div>
  );
}
