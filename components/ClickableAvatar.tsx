"use client";

import { useState } from "react";
import Avatar from "./Avatar";
import PhotoGalleryViewer from "./PhotoGalleryViewer";

export default function ClickableAvatar({
  userId,
  url,
  name,
  size,
  isOwn,
}: {
  userId: string;
  url: string | null;
  name: string;
  size: number;
  isOwn: boolean;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} aria-label="View profile photo" className="viewable inline-flex">
        <Avatar url={url} name={name} size={size} />
      </button>
      {open && <PhotoGalleryViewer userId={userId} isOwn={isOwn} onClose={() => setOpen(false)} />}
    </>
  );
}
