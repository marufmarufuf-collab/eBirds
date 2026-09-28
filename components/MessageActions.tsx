"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { KebabIcon, EditIcon, TrashIcon } from "./icons";

const MENU_W = 208;
// Space kept clear at the bottom for the message composer, so the menu
// flips upward instead of sliding underneath it.
const BOTTOM_RESERVE = 90;

// The menu is rendered in a portal on <body> with fixed positioning. Inside
// the scrolling message list it was clipped by the list's edges (last
// message) and painted over by the next message bubble (each row is its
// own stacking layer). Out here nothing can clip or cover it, and it works
// the same on phone, tablet and desktop.
export default function MessageActions({
  mine,
  canEdit,
  onEdit,
  onDeleteForMe,
  onDeleteForEveryone,
  align,
}: {
  mine: boolean;
  canEdit: boolean;
  onEdit: () => void;
  onDeleteForMe: () => void;
  onDeleteForEveryone: () => void;
  align: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!open) {
      setPos(null);
      return;
    }
    if (!btnRef.current || !menuRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const menuH = menuRef.current.offsetHeight;
    const spaceBelow = window.innerHeight - rect.bottom - BOTTOM_RESERVE;
    const top = spaceBelow >= menuH ? rect.bottom + 4 : Math.max(8, rect.top - menuH - 4);
    let left = align === "right" ? rect.right - MENU_W : rect.left;
    left = Math.min(Math.max(8, left), window.innerWidth - MENU_W - 8);
    setPos({ top, left });
  }, [open, align]);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    function onPointerDown(e: PointerEvent) {
      const t = e.target as Node;
      if (menuRef.current?.contains(t) || btnRef.current?.contains(t)) return;
      setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("scroll", close, true); // capture: catches the message list scrolling
    window.addEventListener("resize", close);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [open]);

  return (
    <div className={`relative ${align === "right" ? "order-first" : ""}`}>
      <button
        ref={btnRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Message options"
        aria-expanded={open}
        className="opacity-70 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100 w-7 h-7 flex items-center justify-center rounded-full hover:bg-[var(--surface-2)] text-[var(--muted)] transition-opacity"
      >
        <KebabIcon className="w-4 h-4" />
      </button>

      {open &&
        createPortal(
          <div
            ref={menuRef}
            className="p-1.5 enter"
            style={{
              position: "fixed",
              top: pos?.top ?? 0,
              left: pos?.left ?? 0,
              width: MENU_W,
              zIndex: 120,
              visibility: pos ? "visible" : "hidden",
              background: "#ffffff",
              border: "1px solid #f0e2d3",
              borderRadius: 14,
              boxShadow: "0 16px 40px -12px rgba(33,23,16,0.28)",
            }}
          >
            {mine && canEdit && (
              <button
                onClick={() => { setOpen(false); onEdit(); }}
                className="w-full flex items-center gap-2 whitespace-nowrap text-left px-3 py-2.5 text-sm rounded-[8px] hover:bg-[var(--surface-2)]"
              >
                <EditIcon className="w-4 h-4" /> Edit
              </button>
            )}
            <button
              onClick={() => { setOpen(false); onDeleteForMe(); }}
              className="w-full flex items-center gap-2 whitespace-nowrap text-left px-3 py-2.5 text-sm rounded-[8px] hover:bg-[var(--surface-2)]"
            >
              <TrashIcon className="w-4 h-4" /> Delete for me
            </button>
            {mine && (
              <button
                onClick={() => { setOpen(false); onDeleteForEveryone(); }}
                className="w-full flex items-center gap-2 whitespace-nowrap text-left px-3 py-2.5 text-sm rounded-[8px] hover:bg-[var(--surface-2)] text-[var(--danger)]"
              >
                <TrashIcon className="w-4 h-4" /> Delete for everyone
              </button>
            )}
          </div>,
          document.body
        )}
    </div>
  );
}
