/**
 * Client-safe helpers for service artwork stored in Supabase Storage.
 *
 * Uploads happen from the admin browser using the signed-in user's session.
 * Row Level Security on `storage.objects` (see
 * `supabase/migrations/0004_storage.sql`) is the real security boundary — the
 * public anon key alone cannot write.
 */

export const SERVICE_ICONS_BUCKET = "service-icons";

/** Maximum accepted upload size (3 MB). */
export const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

export const MAX_IMAGE_LABEL = "3 MB";

export const ACCEPTED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
  "image/avif",
] as const;

export function isAcceptedImageType(type: string): boolean {
  return (ACCEPTED_IMAGE_TYPES as readonly string[]).includes(type);
}

/**
 * Build a unique, URL-safe storage object path. Keeps a sanitised stem for
 * readability and appends a time + random suffix so re-uploads never collide
 * (which also avoids stale CDN caches).
 */
export function buildImagePath(fileName: string, now: number = Date.now()): string {
  const dot = fileName.lastIndexOf(".");
  const hasExt = dot > 0;
  const rawExt = hasExt ? fileName.slice(dot + 1) : "";
  const ext =
    rawExt.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 5) || "png";
  const stem = (hasExt ? fileName.slice(0, dot) : fileName)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  const suffix =
    now.toString(36) + Math.random().toString(36).slice(2, 8);
  return `${stem || "image"}-${suffix}.${ext}`;
}
