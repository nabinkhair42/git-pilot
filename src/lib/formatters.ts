import { formatDistanceToNow, format, isValid } from "date-fns";

export function formatRelativeDate(date: string | Date): string {
  const d = new Date(date);
  if (!isValid(d)) return "Unknown date";
  return formatDistanceToNow(d, { addSuffix: true });
}

export function formatDate(date: string | Date): string {
  const d = new Date(date);
  if (!isValid(d)) return "Unknown date";
  return format(d, "MMM d, yyyy 'at' h:mm a");
}

export function formatHash(hash: string): string {
  return hash.slice(0, 7);
}

export function formatDiffStats(insertions: number, deletions: number): string {
  const parts: string[] = [];
  if (insertions > 0) parts.push(`+${insertions}`);
  if (deletions > 0) parts.push(`-${deletions}`);
  return parts.join(" / ") || "No changes";
}
