"use client";

import PhotoViewer from "./PhotoViewer";

// Chat photo viewer — a single photo through the shared viewer.
export default function ImageLightbox({ src, onClose }: { src: string; onClose: () => void }) {
  return <PhotoViewer photos={[{ url: src }]} index={0} onIndexChange={() => {}} onClose={onClose} />;
}
