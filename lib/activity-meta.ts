import type { Activity } from "@/types/database";

export const ACTIVITY_META: Record<Activity, { label: string; emoji: string }> = {
  walking: { label: "Walking", emoji: "🚶" },
  running: { label: "Running", emoji: "🏃" },
  jogging: { label: "Jogging", emoji: "🏃‍♂️" },
  swimming: { label: "Swimming", emoji: "🏊" },
  trips: { label: "Trips", emoji: "🚌" },
  sightseeing: { label: "Sightseeing", emoji: "🏛️" },
  camping: { label: "Camping", emoji: "🏕️" },
};

export function formatEventDate(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatPrice(price: number | null, currency: string): string {
  if (price === null) return "Free";
  return `${price.toLocaleString()} ${currency}`;
}
