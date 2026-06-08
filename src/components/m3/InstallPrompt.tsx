"use client";

import { usePwaInstall } from "@/hooks/usePwaInstall";

export function InstallPrompt() {
  const { canInstall, install, dismiss, isIos, isStandalone } = usePwaInstall();

  if (!canInstall || isStandalone) return null;

  return (
    <aside
      className="fixed bottom-4 start-4 z-[70] flex max-w-sm items-center gap-3 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur-md"
      aria-label="התקנת אפליקציה"
    >
      <img
        src="/icon-192.png"
        alt=""
        className="size-10 shrink-0 rounded-xl"
        width={40}
        height={40}
      />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-extrabold text-slate-900">התקן את ARTIST 2.0 בנייד</p>
        {isIos ? (
          <p className="text-[11px] text-gray-500">ב-Safari: שיתוף → «הוסף למסך הבית»</p>
        ) : (
          <p className="text-[11px] text-gray-500">גישה מהירה מהמסך הראשי עם קיצור דרך</p>
        )}
      </div>
      <div className="flex shrink-0 gap-1">
        {!isIos && (
          <button
            type="button"
            className="rounded-full bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-700"
            onClick={() => void install()}
          >
            התקן
          </button>
        )}
        <button
          type="button"
          className="rounded-full border border-slate-200 px-2 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-50"
          onClick={dismiss}
          aria-label="סגור"
        >
          ✕
        </button>
      </div>
    </aside>
  );
}
