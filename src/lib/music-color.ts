const NAMED_COLORS: Record<string, string> = {
  red: "#ef4444",
  orange: "#f97316",
  amber: "#f59e0b",
  yellow: "#eab308",
  lime: "#84cc16",
  green: "#22c55e",
  emerald: "#10b981",
  teal: "#14b8a6",
  cyan: "#06b6d4",
  sky: "#0ea5e9",
  blue: "#3b82f6",
  indigo: "#6366f1",
  violet: "#8b5cf6",
  purple: "#a855f7",
  fuchsia: "#d946ef",
  pink: "#ec4899",
  rose: "#f43f5e",
  white: "#e5e7eb",
  gray: "#9ca3af",
  grey: "#9ca3af",
  black: "#111827",
  brown: "#92400e",
  gold: "#d97706",
  silver: "#94a3b8",
};

function normalizeHex(input: string): string | null {
  const value = input.trim();
  const match = value.match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/);
  if (!match) return null;
  if (match[1].length === 3) {
    const [a, b, c] = match[1].split("");
    return `#${a}${a}${b}${b}${c}${c}`.toLowerCase();
  }
  return `#${match[1].toLowerCase()}`;
}

function extractColorToken(text: string): string | null {
  const lower = text.toLowerCase();
  const hex = lower.match(/#(?:[0-9a-f]{3}|[0-9a-f]{6})\b/i)?.[0] ?? null;
  if (hex) return normalizeHex(hex);
  for (const [name, value] of Object.entries(NAMED_COLORS)) {
    const re = new RegExp(`\\b${name}\\b`, "i");
    if (re.test(lower)) return value;
  }
  return null;
}

export function resolveMusicOutlineColor(input: {
  prompt1Question?: string | null;
  prompt1Answer?: string | null;
  prompt2Question?: string | null;
  prompt2Answer?: string | null;
}): string | null {
  const q1 = (input.prompt1Question ?? "").toLowerCase();
  const a1 = input.prompt1Answer ?? "";
  const q2 = (input.prompt2Question ?? "").toLowerCase();
  const a2 = input.prompt2Answer ?? "";

  if (q1.includes("music was a color")) return extractColorToken(a1);
  if (q2.includes("music was a color")) return extractColorToken(a2);

  return null;
}
