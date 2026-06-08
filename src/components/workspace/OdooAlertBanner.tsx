"use client";

type OdooAlertBannerProps = {
  count: number;
};

export function OdooAlertBanner({ count }: OdooAlertBannerProps) {
  if (count <= 0) return null;

  return (
    <div
      className="flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900"
      role="alert"
    >
      <span className="size-2 shrink-0 rounded-full bg-amber-500" aria-hidden />
      <span>
        יש <strong className="font-bold">{count}</strong> אומנים חתומים שצריך לאשר באודו
      </span>
    </div>
  );
}
