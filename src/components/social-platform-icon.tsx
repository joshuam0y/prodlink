"use client";

import type { IconType } from "react-icons";
import { FaAmazon, FaLinkedin } from "react-icons/fa6";
import {
  SiApplemusic,
  SiAudiomack,
  SiBandcamp,
  SiBandlab,
  SiBandsintown,
  SiBeatstars,
  SiBluesky,
  SiCashapp,
  SiDiscord,
  SiFacebook,
  SiGenius,
  SiInstagram,
  SiLinktree,
  SiMastodon,
  SiMedium,
  SiMixcloud,
  SiNapster,
  SiPandora,
  SiPinterest,
  SiReddit,
  SiShazam,
  SiSnapchat,
  SiSongkick,
  SiSoundcloud,
  SiSpotify,
  SiTelegram,
  SiThreads,
  SiTidal,
  SiTiktok,
  SiTwitch,
  SiVenmo,
  SiWhatsapp,
  SiX,
  SiYoutube,
  SiYoutubemusic,
} from "react-icons/si";
import { HiOutlineGlobeAlt, HiOutlineMusicalNote, HiOutlinePencilSquare } from "react-icons/hi2";

const ICONS: Record<string, IconType> = {
  instagram: SiInstagram,
  tiktok: SiTiktok,
  spotify: SiSpotify,
  soundcloud: SiSoundcloud,
  youtube: SiYoutube,
  youtubemusic: SiYoutubemusic,
  x: SiX,
  facebook: SiFacebook,
  threads: SiThreads,
  snapchat: SiSnapchat,
  linkedin: FaLinkedin,
  pinterest: SiPinterest,
  reddit: SiReddit,
  bluesky: SiBluesky,
  mastodon: SiMastodon,
  twitch: SiTwitch,
  discord: SiDiscord,
  apple_music: SiApplemusic,
  bandcamp: SiBandcamp,
  beatstars: SiBeatstars,
  bandlab: SiBandlab,
  audiomack: SiAudiomack,
  mixcloud: SiMixcloud,
  tidal: SiTidal,
  deezer: HiOutlineMusicalNote,
  amazon_music: FaAmazon,
  shazam: SiShazam,
  pandora: SiPandora,
  napster: SiNapster,
  linktree: SiLinktree,
  bandsintown: SiBandsintown,
  songkick: SiSongkick,
  genius: SiGenius,
  medium: SiMedium,
  whatsapp: SiWhatsapp,
  telegram: SiTelegram,
  cashapp: SiCashapp,
  venmo: SiVenmo,
  beacons: HiOutlineGlobeAlt,
  website: HiOutlineGlobeAlt,
  custom: HiOutlinePencilSquare,
};

type Props = {
  id: string;
  className?: string;
};

export function SocialPlatformIcon({ id, className }: Props) {
  const Cmp = ICONS[id] ?? HiOutlineGlobeAlt;
  return <Cmp className={className} aria-hidden />;
}
