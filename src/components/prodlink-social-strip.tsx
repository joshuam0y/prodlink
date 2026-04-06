import Image from "next/image";

const SOCIALS = [
  { href: "https://www.instagram.com/prodlinkapp", label: "Instagram" },
  { href: "https://www.tiktok.com/@prodlinkapp", label: "TikTok" },
  { href: "https://x.com/prodlinkapp", label: "X" },
  { href: "https://www.reddit.com/user/prodlinkapp/", label: "Reddit" },
] as const;

type Props = {
  /** Tighter spacing when embedded in dense footers */
  compact?: boolean;
};

/**
 * Wordless mark (matches social avatars) plus outbound links — does not replace the main sidebar wordmark.
 */
export function ProdlinkSocialStrip({ compact = false }: Props) {
  return (
    <div
      className={`flex flex-wrap items-center gap-x-3 gap-y-2 ${compact ? "" : "justify-center sm:justify-start"}`}
    >
      <Image
        src="/prodlink-mark.png"
        alt="prodLink"
        width={compact ? 36 : 44}
        height={compact ? 36 : 44}
        className="h-9 w-9 shrink-0 rounded-lg object-cover sm:h-11 sm:w-11"
      />
      <p className={`text-xs text-zinc-500 ${compact ? "" : "sm:text-sm"}`}>
        <span className="font-medium text-zinc-400">Follow prodLink</span>
        <span className="mx-1.5 text-zinc-700">·</span>
        {SOCIALS.map((s, i) => (
          <span key={s.href}>
            {i > 0 ? <span className="text-zinc-700"> · </span> : null}
            <a
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-amber-400/90 underline-offset-2 transition hover:text-amber-300 hover:underline"
            >
              {s.label}
            </a>
          </span>
        ))}
      </p>
    </div>
  );
}
