/** Short label for profile `role` strings used in lists and cards. */
export function roleLabel(raw: string | null): string {
  const s = (raw ?? "").toLowerCase();
  if (s.includes("producer")) return "Producer";
  if (s.includes("dj")) return "DJ";
  if (s.includes("engineer")) return "Engineer";
  if (s.includes("venue") || s.includes("promoter")) return "Venue";
  if (s.includes("label")) return "Label";
  if (s.includes("artist")) return "Artist";
  return "Artist";
}

/** Discover / public profile: primary · secondary when both are set and distinct. */
export function formatRoleLine(
  primary: string | null | undefined,
  secondary: string | null | undefined,
): string {
  const a = roleLabel(primary ?? null);
  const b = roleLabel(secondary ?? null);
  if (b && b !== a) return `${a} · ${b}`;
  return a;
}
