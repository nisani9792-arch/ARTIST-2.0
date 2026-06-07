"use client";

type OdooAlertBannerProps = {
  count: number;
};

export function OdooAlertBanner({ count }: OdooAlertBannerProps) {
  if (count <= 0) return null;

  return (
    <div className="odoo-alert" role="alert">
      <span className="odoo-alert__dot" aria-hidden />
      <span className="odoo-alert__text">
        יש <strong>{count}</strong> אומנים חתומים שצריך לאשר באודו
      </span>
    </div>
  );
}
