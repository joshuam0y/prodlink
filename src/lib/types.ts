export type Role = "producer" | "artist" | "dj" | "engineer" | "venue" | "label";

/** Short audio preview for discover cards (URLs must allow streaming). */
export type BeatPreview = {
  id: string;
  title: string;
  /** Optional for venues (photos-only). */
  audioUrl?: string;
  coverUrl: string;
};

export type ProfileCard = {
  id: string;
  displayName: string;
  avatarUrl?: string | null;
  aiSummary?: string | null;
  aiTags?: string[];
  aiScore?: number | null;
  role: Role;
  /** Header line for cards, e.g. "Producer · DJ" when dual roles exist. */
  roleDisplay: string;
  city: string;
  niche: string;
  bio: string;
  highlight: string;
  /** CSS gradient or color for card header */
  accent: string;
  /** Text used for the "Looking for" filter. */
  lookingFor?: string | null;
  goal?: string | null;
  prompt1Question?: string | null;
  prompt1Answer?: string | null;
  prompt2Question?: string | null;
  prompt2Answer?: string | null;
  /** Featured track — auto-plays when the card is shown (after user has interacted with the page). */
  starBeat?: BeatPreview;
  /** Additional previews (UI shows up to five). */
  extraBeats?: BeatPreview[];
  /** Optional discover explanation badge, e.g. "Highly rated". */
  rankReason?: string;
  /** Short human-readable explanation for why this profile is a fit. */
  matchWhy?: string[];
  /** Semantic similarity score from pgvector when available. */
  semanticScore?: number;
  /** Distance from viewer in km when viewer location is set. */
  distanceKm?: number;
  /** They saved you on Discover; surfaced first in the stack. */
  likedYou?: boolean;
  verificationBadges?: string[];
};

export type BeatBundle = {
  id: string;
  creatorId: string;
  creatorName: string;
  title: string;
  priceLabel: string;
  trackCount: number;
  genres: string[];
  accent: string;
};

/** Row in `public.profiles` */
export type DbProfile = {
  id: string;
  created_at?: string | null;
  display_name: string | null;
  pronouns?: string | null;
  avatar_url?: string | null;
  ai_summary?: string | null;
  ai_tags?: unknown;
  ai_profile_score?: number | null;
  ai_updated_at?: string | null;
  role: string | null;
  niche: string | null;
  goal: string | null;
  city?: string | null;
  neighborhood?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  location_radius_km?: number | null;
  looking_for?: string | null;
  prompt_1_question?: string | null;
  prompt_1_answer?: string | null;
  prompt_2_question?: string | null;
  prompt_2_answer?: string | null;
  onboarding_completed_at: string | null;
  /** App open / heartbeat; distinct from profile edit `updated_at`. */
  last_seen_at?: string | null;
  /** Extra public photos on `/p/[id]` (HTTPS URLs, max 6 in app). */
  gallery_image_urls?: unknown;
  updated_at?: string | null;
  star_beat_title?: string | null;
  star_beat_audio_url?: string | null;
  star_beat_cover_url?: string | null;
  /** JSON array of `{ title, audio_url, cover_url }` — max 5 enforced in app */
  extra_beats?: unknown;
  /** Optional per-section visibility on `/p/[id]`; see `public-visibility.ts`. */
  public_visibility?: unknown;
  /** JSON array of `{ label, url }` — max 6, HTTPS URLs. */
  social_links?: unknown;
  /** Second role when dual-role roadmap is enabled. */
  secondary_role?: string | null;
  /** HTTPS SoundCloud profile URL (roadmap / verification). */
  soundcloud_url?: string | null;
  verification_status?: "unverified" | "partial" | "verified" | null;
  id_verified_at?: string | null;
  linked_account_verified_at?: string | null;
};
