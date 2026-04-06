import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Discover",
};

export default function HowItWorksDiscoverPage() {
  return (
    <div className="space-y-8">
      <article className="rounded-3xl border border-white/10 bg-zinc-900/35 p-6 sm:p-8">
        <Link
          href="/how-it-works"
          className="text-sm font-medium text-amber-400/95 underline-offset-4 transition hover:underline"
        >
          ← How it works overview
        </Link>
        <h1 className="mt-6 text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">
          Discover nearby, with less noise
        </h1>
        <div className="mt-6 space-y-4 text-sm leading-relaxed text-zinc-400 sm:text-base">
          <p>
            Swipe through active profiles, tune distance when you need it (more granular
            miles and neighborhood-style filters are on the roadmap), and open full
            profiles when someone looks like a real fit—not another anonymous global
            feed.
          </p>
        </div>
      </article>

      <article className="rounded-3xl border border-white/10 bg-zinc-900/35 p-6 sm:p-8">
        <h2 className="text-lg font-semibold text-zinc-100 sm:text-xl">
          Best way to use Discover
        </h2>
        <ul className="mt-4 space-y-3 text-sm leading-relaxed text-zinc-400 sm:text-base">
          <li>Lead with the main card first. Only open filters when you need to narrow the feed.</li>
          <li>Open a card, hear the sound, then decide fast.</li>
          <li>
            Open the full profile when someone looks promising so you can read their prompts
            and goals before messaging.
          </li>
        </ul>
      </article>
    </div>
  );
}
