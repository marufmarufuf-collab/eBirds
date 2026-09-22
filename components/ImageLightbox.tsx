"use client";

export default function ImageLightbox({ src, onClose }: { src: string; onClose: () => void }) {
  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-[100] bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white text-2xl w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10"
        aria-label="Close"
      >
        ×
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt="Full size"
        className="max-w-full max-h-full object-contain rounded"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}
