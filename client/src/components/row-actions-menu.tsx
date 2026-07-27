"use client";

import { IconMoreHorizontal } from "@/components/icons";
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

export type RowMenuItem = {
  id: string;
  label: string;
  onClick: () => void;
  variant?: "default" | "danger";
  disabled?: boolean;
};

const ROW_ATTR = "data-row-actions";

export function RowActionsMenu({ items }: { items: RowMenuItem[] }) {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(
    null
  );
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const updatePosition = () => {
    const btn = buttonRef.current;
    if (!btn) return;
    const rect = btn.getBoundingClientRect();
    setMenuPos({
      top: rect.bottom + 4,
      left: rect.right,
    });
  };

  useLayoutEffect(() => {
    if (!open) {
      setMenuPos(null);
      return;
    }
    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open]);

  useEffect(() => {
    const row = rootRef.current?.closest<HTMLElement>(`[${ROW_ATTR}]`);
    if (!row) return;
    if (open) {
      row.dataset.menuOpen = "true";
    } else {
      delete row.dataset.menuOpen;
    }
    return () => {
      delete row.dataset.menuOpen;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (
        buttonRef.current?.contains(t) ||
        menuRef.current?.contains(t)
      ) {
        return;
      }
      setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const visible = items.filter((i) => !i.disabled);
  if (visible.length === 0) return null;

  const menu =
    open &&
    menuPos &&
    typeof document !== "undefined" &&
    createPortal(
      <div
        id={menuId}
        ref={menuRef}
        role="menu"
        style={{
          position: "fixed",
          top: menuPos.top,
          left: menuPos.left,
          transform: "translateX(-100%)",
          zIndex: 9999,
        }}
        className="min-w-[11rem] rounded-lg border border-zinc-200 bg-white py-1 shadow-lg"
      >
        {visible.map((item) => (
          <button
            key={item.id}
            type="button"
            role="menuitem"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
              item.onClick();
            }}
            className={`block w-full px-3 py-2 text-left text-sm ${
              item.variant === "danger"
                ? "text-red-600 hover:bg-red-50"
                : "text-zinc-800 hover:bg-zinc-50"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>,
      document.body
    );

  return (
    <div className="relative" ref={rootRef} data-row-actions-anchor>
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={open ? menuId : undefined}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="rounded-md p-1.5 text-zinc-500 hover:bg-emerald-100/80 hover:text-emerald-900"
        aria-label="Actions"
      >
        <IconMoreHorizontal className="h-5 w-5" />
      </button>
      {menu}
    </div>
  );
}
