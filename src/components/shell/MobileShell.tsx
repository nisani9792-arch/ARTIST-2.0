"use client";

import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

type MobileShellProps = {
  children: ReactNode;
  bottomNav: ReactNode;
  className?: string;
};

export function MobileShell({ children, bottomNav, className }: MobileShellProps) {
  return (
    <div className={cn("flex h-dvh max-h-dvh flex-col overflow-hidden bg-zinc-50 font-sans", className)}>
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden pb-[calc(3.5rem+var(--safe-bottom))] lg:pb-0">
        {children}
      </div>
      <nav
        className="fixed inset-x-0 bottom-0 z-50 border-t border-slate-200 bg-white/95 pb-safe backdrop-blur-md lg:hidden"
        aria-label="ניווט ראשי"
      >
        {bottomNav}
      </nav>
    </div>
  );
}

type BottomNavItemProps = {
  label: string;
  active?: boolean;
  onClick: () => void;
  badge?: number;
};

export function BottomNavItem({ label, active, onClick, badge }: BottomNavItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-bold transition",
        active ? "text-blue-600" : "text-slate-500",
      )}
    >
      {label}
      {badge != null && badge > 0 && (
        <span className="absolute top-1 start-1/2 ms-2 min-w-[16px] rounded-full bg-cyan-600 px-1 text-[9px] text-white">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </button>
  );
}
