"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { getProfilePhotos, deleteProfilePhoto } from "@/lib/actions/profile";
import Spinner from "./Spinner";
import type { ProfilePhoto } from "@/types/database";

export default function PhotoGalleryViewer({
  userId,
  isOwn,
  onClose,
}: {
  userId: string;
  isOwn: boolean;
  onClose: () => void;
}) {
  const [photos, setPhotos] = useState<ProfilePhoto[] | null>(null);
  const [index, setIndex] = useState(0);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    getProfilePhotos(userId).then(setPhotos);
  }, [userId]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") setIndex((i) => Math.max(0, i - 1));
      if (e.key === "ArrowRight") setIndex((i) => Math.min((photos?.length ?? 1) - 1, i + 1));
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, photos]);

  function handleDelete(photoId: string) {
    startTransition(async () => {
      await deleteProfilePhoto(photoId);
      const updated = (photos ?? []).filter((p) => p.id !== photoId);
      setPhotos(updated);
      setIndex((i) => Math.min(i, Math.max(0, updated.length - 1)));
      router.refresh();
      if (updated.length === 0) onClose();
    });
  }

  const current = photos?.[index];

  return (
    <div onClick={onClose} className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 cursor-zoom-out">
      <button onClick={onClose} className="absolute top-4 right-4 text-white text-2xl w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10" aria-label="Close">
        ×
      </button>

      {photos === null && <Spinner className="text-white text-2xl" />}

      {photos !== null && photos.length === 0 && (
        <p className="text-white/80 text-sm">No photos yet.</p>
      )}

      {current && (
        <div onClick={(e) => e.stopPropagation()} className="relative max-w-full max-h-full flex flex-col items-center gap-3">
          <div className="flex items-center gap-3">
            {photos!.length > 1 && index > 0 && (
              <button onClick={() => setIndex((i) => i - 1)} className="text-white text-3xl px-2 hover:opacity-70" aria-label="Previous photo">
                ‹
              </button>
            )}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={current.url} alt="Profile" className="max-w-[80vw] max-h-[70vh] object-contain rounded" />
            {photos!.length > 1 && index < photos!.length - 1 && (
              <button onClick={() => setIndex((i) => i + 1)} className="text-white text-3xl px-2 hover:opacity-70" aria-label="Next photo">
                ›
              </button>
            )}
          </div>

          {photos!.length > 1 && (
            <p className="text-white/60 text-xs">{index + 1} / {photos!.length}</p>
          )}

          {isOwn && (
            <button
              onClick={() => handleDelete(current.id)}
              disabled={pending}
              className="btn text-white border border-white/30 hover:bg-white/10 !px-4"
            >
              {pending && <Spinner />} {pending ? "Deleting…" : "Delete this photo"}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
