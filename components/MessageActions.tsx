"use client";

import { KebabIcon, EditIcon, TrashIcon } from "./icons";
import { useDropdown } from "./useClickOutside";

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
  const { open, setOpen, ref } = useDropdown<HTMLDivElement>();

  return (
    <div className={`relative ${align === "right" ? "order-first" : ""}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Message options"
        className="opacity-70 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100 w-6 h-6 flex items-center justify-center rounded-full hover:bg-[var(--surface-2)] text-[var(--muted)] transition-opacity"
      >
        <KebabIcon className="w-4 h-4" />
      </button>

      {open && (
        <div
          className={`absolute ${align === "right" ? "right-0" : "left-0"} top-full mt-1 w-44 p-1.5 z-30 enter`}
          style={{ background: "#ffffff", border: "1px solid #f0e2d3", borderRadius: 14, boxShadow: "0 16px 40px -12px rgba(33,23,16,0.28)" }}
        >
          {mine && canEdit && (
            <button
              onClick={() => { setOpen(false); onEdit(); }}
              className="w-full flex items-center gap-2 text-left px-3 py-2 text-sm rounded-[8px] hover:bg-[var(--surface-2)]"
            >
              <EditIcon className="w-4 h-4" /> Edit
            </button>
          )}
          <button
            onClick={() => { setOpen(false); onDeleteForMe(); }}
            className="w-full flex items-center gap-2 text-left px-3 py-2 text-sm rounded-[8px] hover:bg-[var(--surface-2)]"
          >
            <TrashIcon className="w-4 h-4" /> Delete for me
          </button>
          {mine && (
            <button
              onClick={() => { setOpen(false); onDeleteForEveryone(); }}
              className="w-full flex items-center gap-2 text-left px-3 py-2 text-sm rounded-[8px] hover:bg-[var(--surface-2)] text-[var(--danger)]"
            >
              <TrashIcon className="w-4 h-4" /> Delete for everyone
            </button>
          )}
        </div>
      )}
    </div>
  );
}
