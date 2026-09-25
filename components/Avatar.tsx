// A small, warm palette in the same family as the brand orange, so
// fallback avatars feel designed rather than a flat placeholder — each
// name deterministically lands on the same color every time.
const PALETTE = [
  "#e3540a", // accent-dark
  "#c2410c",
  "#a16207",
  "#b45309",
  "#9d174d",
  "#7c2d12",
  "#92400e",
  "#be123c",
];

function colorFor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

export default function Avatar({ url, name, size = 40 }: { url: string | null; name: string; size?: number }) {
  const initial = name?.[0]?.toUpperCase() || "?";

  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={name}
        width={size}
        height={size}
        style={{ width: size, height: size }}
        className="rounded-full object-cover border shrink-0"
      />
    );
  }

  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.4, background: colorFor(name || "?") }}
      className="rounded-full text-white flex items-center justify-center font-medium shrink-0"
    >
      {initial}
    </div>
  );
}
