"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Spinner from "./Spinner";
import { TrashIcon } from "./icons";

export type ViewerPhoto = { id?: string; url: string };

// THE full-screen photo viewer for the whole app — chat photos and profile
// photos both render through this, so they always look and feel identical.
//
// It renders in a portal on <body>. A "fixed" element inside an animated
// (transformed) ancestor — like the profile popup — gets trapped in that
// ancestor's box instead of covering the screen; the portal makes that
// impossible.
export default function PhotoViewer({
  photos,
  index,
  onIndexChange,
  onClose,
  loading = false,
  onDelete,
  deleting = false,
}: {
  photos: ViewerPhoto[];
  index: number;
  onIndexChange: (i: number) => void;
  onClose: () => void;
  loading?: boolean;
  onDelete?: () => void;
  deleting?: boolean;
}) {
  const touchStartX = useRef<number | null>(null);
  const current = photos[index];
  const multiple = photos.length > 1;

  function go(delta: number) {
    const next = index + delta;
    if (next >= 0 && next < photos.length) onIndexChange(next);
  }

  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden"; // no page scrolling behind the viewer
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") go(-1);
      if (e.key === "ArrowRight") go(1);
    }
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, photos.length, onClose]);

  if (typeof document === "undefined") return null;

  const arrowBtn =
    "absolute top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center backdrop-blur-sm transition-colors";

  return createPortal(
    <div
      onClick={onClose}
      onTouchStart={(e) => (touchStartX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchStartX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchStartX.current;
        touchStartX.current = null;
        if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1); // swipe left = next
      }}
      className="fixed inset-0 z-[150] bg-black/95 backdrop-fade flex items-center justify-center cursor-zoom-out"
    >
      <button
        onClick={(e) => { e.stopPropagation(); onClose(); }}
        aria-label="Close"
        className="absolute right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white text-2xl leading-none flex items-center justify-center backdrop-blur-sm transition-colors"
        style={{ top: "max(16px, env(safe-area-inset-top))" }}
      >
        ×
      </button>

      {multiple && (
        <p
          className="absolute left-1/2 -translate-x-1/2 text-white/80 text-xs px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm"
          style={{ top: "max(22px, calc(env(safe-area-inset-top) + 6px))" }}
        >
          {index + 1} / {photos.length}
        </p>
      )}

      {loading && !current && <Spinner className="text-white text-2xl" />}
      {!loading && !current && <p className="text-white/80 text-sm">No photos yet.</p>}

      {current && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={current.url}
          src={current.url}
          alt="Full size"
          onClick={(e) => e.stopPropagation()}
          draggable={false}
          className="photo-pop max-w-[94vw] max-h-[84vh] object-contain rounded-lg shadow-2xl cursor-default select-none"
        />
      )}

      {multiple && index > 0 && (
        <button onClick={(e) => { e.stopPropagation(); go(-1); }} aria-label="Previous photo" className={`${arrowBtn} left-3 sm:left-6`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 5-7 7 7 7" /></svg>
        </button>
      )}
      {multiple && index < photos.length - 1 && (
        <button onClick={(e) => { e.stopPropagation(); go(1); }} aria-label="Next photo" className={`${arrowBtn} right-3 sm:right-6`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 5 7 7-7 7" /></svg>
        </button>
      )}

      {onDelete && current && (
        <div className="absolute inset-x-0 flex justify-center" style={{ bottom: "max(20px, calc(env(safe-area-inset-bottom) + 12px))" }}>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            disabled={deleting}
            className="btn text-white bg-white/10 hover:bg-white/20 backdrop-blur-sm !rounded-full !px-5"
          >
            {deleting ? <Spinner /> : <TrashIcon />} {deleting ? "Deleting…" : "Delete photo"}
          </button>
        </div>
      )}
    </div>,
    document.body
  );
}
