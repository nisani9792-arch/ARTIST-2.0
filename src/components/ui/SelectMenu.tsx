"use client";

import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/cn";

export type SelectOption = {
  value: string;
  label: string;
};

type SelectMenuProps = {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
};

export function SelectMenu({
  value,
  options,
  onChange,
  label,
  placeholder = "בחר…",
  className,
  disabled,
}: SelectMenuProps) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const listId = useId();

  const selected = options.find((o) => o.value === value);

  const updatePosition = () => {
    const trigger = triggerRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    const menuWidth = Math.max(rect.width, 168);
    const maxHeight = 240;
    const margin = 8;

    let left = rect.left;
    if (left + menuWidth > window.innerWidth - margin) {
      left = window.innerWidth - menuWidth - margin;
    }
    left = Math.max(margin, left);

    const spaceBelow = window.innerHeight - rect.bottom - margin;
    const spaceAbove = rect.top - margin;
    const openUp = spaceBelow < 160 && spaceAbove > spaceBelow;

    setMenuStyle({
      position: "fixed",
      left,
      width: menuWidth,
      top: openUp ? rect.top - Math.min(maxHeight, spaceAbove) - 4 : rect.bottom + 4,
      maxHeight: openUp ? Math.min(maxHeight, spaceAbove) : Math.min(maxHeight, spaceBelow),
      zIndex: 200,
    });
  };

  useEffect(() => {
    if (!open) return;
    updatePosition();

    const closeOnOutside = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (
        triggerRef.current?.contains(target) ||
        menuRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    };

    const onReflow = () => updatePosition();
    window.addEventListener("scroll", onReflow, true);
    window.addEventListener("resize", onReflow);
    document.addEventListener("mousedown", closeOnOutside);
    document.addEventListener("touchstart", closeOnOutside);

    return () => {
      window.removeEventListener("scroll", onReflow, true);
      window.removeEventListener("resize", onReflow);
      document.removeEventListener("mousedown", closeOnOutside);
      document.removeEventListener("touchstart", closeOnOutside);
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listId}
        aria-label={label}
        onClick={() => {
          if (disabled) return;
          setOpen((prev) => !prev);
        }}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 outline-none transition",
          "focus:ring-2 focus:ring-blue-500 disabled:opacity-50",
          open && "border-blue-400 ring-2 ring-blue-200",
          className,
        )}
      >
        <span className="truncate">{selected?.label ?? placeholder}</span>
        <span className="shrink-0 text-[10px] text-gray-400" aria-hidden>
          ▾
        </span>
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            id={listId}
            role="listbox"
            aria-label={label}
            style={menuStyle}
            className="overflow-y-auto rounded-xl border border-slate-200 bg-white py-1 shadow-xl"
          >
            {options.map((option) => {
              const active = option.value === value;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={active}
                  className={cn(
                    "flex w-full items-center px-3 py-2 text-start text-xs font-medium transition",
                    active
                      ? "bg-blue-50 font-bold text-blue-700"
                      : "text-slate-700 hover:bg-slate-50",
                  )}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                >
                  {option.label}
                </button>
              );
            })}
          </div>,
          document.body,
        )}
    </>
  );
}
