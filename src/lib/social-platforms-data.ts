/**
 * Ordered roughly by popularity among creators / music networking (social first, then streaming & tools).
 * `id` is stable for UI; saved `label` in DB is the display name.
 */
export const SOCIAL_PLATFORM_OPTIONS = [
  { id: "instagram", label: "Instagram" },
  { id: "tiktok", label: "TikTok" },
  { id: "spotify", label: "Spotify" },
  { id: "soundcloud", label: "SoundCloud" },
  { id: "youtube", label: "YouTube" },
  { id: "youtubemusic", label: "YouTube Music" },
  { id: "x", label: "X" },
  { id: "facebook", label: "Facebook" },
  { id: "threads", label: "Threads" },
  { id: "snapchat", label: "Snapchat" },
  { id: "linkedin", label: "LinkedIn" },
  { id: "pinterest", label: "Pinterest" },
  { id: "reddit", label: "Reddit" },
  { id: "bluesky", label: "Bluesky" },
  { id: "mastodon", label: "Mastodon" },
  { id: "twitch", label: "Twitch" },
  { id: "discord", label: "Discord" },
  { id: "apple_music", label: "Apple Music" },
  { id: "bandcamp", label: "Bandcamp" },
  { id: "beatstars", label: "BeatStars" },
  { id: "bandlab", label: "BandLab" },
  { id: "audiomack", label: "Audiomack" },
  { id: "mixcloud", label: "Mixcloud" },
  { id: "tidal", label: "Tidal" },
  { id: "deezer", label: "Deezer" },
  { id: "amazon_music", label: "Amazon Music" },
  { id: "shazam", label: "Shazam" },
  { id: "pandora", label: "Pandora" },
  { id: "napster", label: "Napster" },
  { id: "linktree", label: "Linktree" },
  { id: "bandsintown", label: "Bandsintown" },
  { id: "songkick", label: "Songkick" },
  { id: "genius", label: "Genius" },
  { id: "medium", label: "Medium" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "telegram", label: "Telegram" },
  { id: "cashapp", label: "Cash App" },
  { id: "venmo", label: "Venmo" },
  { id: "beacons", label: "Beacons" },
  { id: "website", label: "Website" },
  { id: "custom", label: "Custom label…" },
] as const;

export type KnownSocialPlatformId = (typeof SOCIAL_PLATFORM_OPTIONS)[number]["id"];

const LABEL_TO_ID = new Map<string, KnownSocialPlatformId>();
for (const p of SOCIAL_PLATFORM_OPTIONS) {
  LABEL_TO_ID.set(p.label.toLowerCase(), p.id);
}

const ALIASES: Record<string, KnownSocialPlatformId> = {
  twitter: "x",
  "x (twitter)": "x",
  ig: "instagram",
  insta: "instagram",
  sc: "soundcloud",
  yt: "youtube",
  fb: "facebook",
  igram: "instagram",
  tik: "tiktok",
};

/** Map a saved DB label back to a platform id for the picker, or custom. */
export function matchLabelToPlatformId(label: string): KnownSocialPlatformId | "custom" {
  const t = label.trim().toLowerCase();
  if (!t) return "custom";
  const direct = LABEL_TO_ID.get(t);
  if (direct) return direct;
  const alias = ALIASES[t];
  if (alias) return alias;
  return "custom";
}

export function platformIdToLabel(id: KnownSocialPlatformId, customLabel: string): string {
  if (id === "custom") return customLabel.trim();
  const row = SOCIAL_PLATFORM_OPTIONS.find((p) => p.id === id);
  return row?.label ?? customLabel.trim();
}
