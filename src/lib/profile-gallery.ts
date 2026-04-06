/** Extra photos on `/p/[id]` (separate from avatar and beat artwork). */
export function parseGalleryImageUrls(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((u): u is string => typeof u === "string" && u.trim().length > 0)
    .map((u) => u.trim())
    .slice(0, 6);
}
