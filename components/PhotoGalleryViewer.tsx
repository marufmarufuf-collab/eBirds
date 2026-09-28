"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { getProfilePhotos, deleteProfilePhoto } from "@/lib/actions/profile";
import PhotoViewer, { type ViewerPhoto } from "./PhotoViewer";

// Profile photo viewer — same shared viewer as chat photos. It opens
// instantly showing the current photo (already known), then quietly loads
// the rest of the gallery so you can swipe through older ones.
export default function PhotoGalleryViewer({
  userId,
  isOwn,
  currentUrl,
  onClose,
}: {
  userId: string;
  isOwn: boolean;
  currentUrl: string | null;
  onClose: () => void;
}) {
  const [photos, setPhotos] = useState<ViewerPhoto[]>(currentUrl ? [{ url: currentUrl }] : []);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;
    getProfilePhotos(userId).then((list) => {
      if (cancelled) return;
      let merged: ViewerPhoto[] = list.map((p) => ({ id: p.id, url: p.url }));
      // Photos set before the gallery existed have no row — still show them.
      if (currentUrl && !merged.some((p) => p.url === currentUrl)) merged = [{ url: currentUrl }, ...merged];
      if (merged.length) {
        setPhotos(merged);
        setIndex(Math.max(0, currentUrl ? merged.findIndex((p) => p.url === currentUrl) : 0));
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [userId, currentUrl]);

  function handleDelete() {
    const target = photos[index];
    if (!target?.id) return;
    startTransition(async () => {
      await deleteProfilePhoto(target.id!);
      const updated = photos.filter((p) => p.id !== target.id);
      setPhotos(updated);
      setIndex((i) => Math.min(i, Math.max(0, updated.length - 1)));
      router.refresh();
      if (updated.length === 0) onClose();
    });
  }

  return (
    <PhotoViewer
      photos={photos}
      index={index}
      onIndexChange={setIndex}
      onClose={onClose}
      loading={loading}
      onDelete={isOwn && photos[index]?.id ? handleDelete : undefined}
      deleting={pending}
    />
  );
}
