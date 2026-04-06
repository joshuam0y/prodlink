/**
 * Roadmap features — toggle with env (see `.env.example`).
 * `NEXT_PUBLIC_ROADMAP_ENABLE_ALL=1` turns on every flag that does not have an explicit override.
 */

function truthy(v: string | undefined): boolean {
  return v === "1" || v === "true";
}

function envOverride(key: string): boolean | undefined {
  const v = process.env[key];
  if (v === undefined) return undefined;
  return truthy(v);
}

export function isRoadmapEnableAll(): boolean {
  return truthy(process.env.NEXT_PUBLIC_ROADMAP_ENABLE_ALL);
}

function featureEnabled(envKey: string): boolean {
  const override = envOverride(envKey);
  if (override !== undefined) return override;
  return isRoadmapEnableAll();
}

/** ~15s (configurable) cap on discover card audio preview playback. */
export function isCardAudioPreviewCapEnabled(): boolean {
  return featureEnabled("NEXT_PUBLIC_ROADMAP_CARD_AUDIO_PREVIEW");
}

export function getCardAudioPreviewMaxSeconds(): number {
  const raw = process.env.NEXT_PUBLIC_ROADMAP_CARD_AUDIO_MAX_SECONDS;
  const n = raw ? Number(raw) : 15;
  if (!Number.isFinite(n) || n <= 0) return 15;
  return Math.min(120, Math.max(5, Math.round(n)));
}

export function isDualRolesEnabled(): boolean {
  return featureEnabled("NEXT_PUBLIC_ROADMAP_DUAL_ROLES");
}

export function isLabelRoleEnabled(): boolean {
  return featureEnabled("NEXT_PUBLIC_ROADMAP_LABEL_ROLE");
}

/** Optional SoundCloud URL field on profile (future verification). */
export function isSoundcloudFieldEnabled(): boolean {
  return featureEnabled("NEXT_PUBLIC_ROADMAP_SOUNDCLOUD_FIELD");
}

export function isBetaPerksUiEnabled(): boolean {
  return featureEnabled("NEXT_PUBLIC_ROADMAP_BETA_PERKS_UI");
}

/** Show roadmap extension block on /profile when any sub-feature needs it. */
export function isRoadmapProfileSectionVisible(): boolean {
  return isDualRolesEnabled() || isSoundcloudFieldEnabled() || isBetaPerksUiEnabled();
}
