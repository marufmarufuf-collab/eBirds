export default function Avatar({ url, name, size = 40 }: { url: string | null; name: string; size?: number }) {
  const initial = name?.[0]?.toUpperCase() || "?";
  if (url) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={url}
        alt={name}
        width={size}
        height={size}
        style={{ width: size, height: size }}
        className="rounded-full object-cover border"
      />
    );
  }
  return (
    <div
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      className="rounded-full bg-[var(--ink)] text-[var(--paper)] flex items-center justify-center font-medium"
    >
      {initial}
    </div>
  );
}
