"use client";

import { usePwaInstall } from "@/hooks/usePwaInstall";

export function InstallPrompt() {
  const { canInstall, install, dismiss, isIos, isStandalone } = usePwaInstall();

  if (!canInstall || isStandalone) return null;

  return (
    <aside className="install-banner" aria-label="התקנת אפליקציה">
      <img src="/icon-192.png" alt="" className="install-banner__icon" width={40} height={40} />
      <div className="install-banner__text">
        <strong>התקן את ARTIST 2.0 בנייד</strong>
        {isIos ? (
          <p>ב-Safari: שיתוף → «הוסף למסך הבית»</p>
        ) : (
          <p>גישה מהירה מהמסך הראשי עם קיצור דרך</p>
        )}
      </div>
      <div className="install-banner__actions">
        {!isIos && (
          <button type="button" className="m3-btn m3-btn--filled" onClick={() => void install()}>
            התקן
          </button>
        )}
        <button type="button" className="m3-btn" onClick={dismiss} aria-label="סגור">
          ✕
        </button>
      </div>
    </aside>
  );
}
