const URL_RE = /((https?:\/\/|www\.)[^\s<>"]+)/gi;

export function splitLinks(text: string): { type: "text" | "link"; value: string }[] {
  const parts: { type: "text" | "link"; value: string }[] = [];
  let lastIndex = 0;
  for (const match of text.matchAll(URL_RE)) {
    const start = match.index ?? 0;
    if (start > lastIndex) parts.push({ type: "text", value: text.slice(lastIndex, start) });
    parts.push({ type: "link", value: match[0] });
    lastIndex = start + match[0].length;
  }
  if (lastIndex < text.length) parts.push({ type: "text", value: text.slice(lastIndex) });
  return parts;
}
