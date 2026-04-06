import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Beta & roadmap",
};

export default function HowItWorksRoadmapPage() {
  return (
    <article className="rounded-3xl border border-white/10 bg-zinc-900/35 p-6 sm:p-8">
      <Link
        href="/how-it-works"
        className="text-sm font-medium text-amber-400/95 underline-offset-4 transition hover:underline"
      >
        ← How it works overview
      </Link>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">
        Beta, safety, and what&apos;s next
      </h1>
      <div className="mt-6 space-y-4 text-sm leading-relaxed text-zinc-400 sm:text-base">
        <p>
          prodLink is in <strong className="font-medium text-zinc-300">beta</strong>
          —we&apos;re shipping with early users and adjusting fast. Early supporters get{" "}
          <strong className="font-medium text-zinc-300">beta perks</strong> as major
          features go live. If something feels off, use{" "}
          <Link href="/help" className="font-medium text-amber-400/95 underline-offset-2 hover:underline">
            Help
          </Link>{" "}
          to reach us.
        </p>
        <p>
          We&apos;re serious about{" "}
          <strong className="font-medium text-zinc-300">real people and safer connections</strong>
          . On the roadmap: government ID and face verification, linked SoundCloud (or
          similar), short playable clips on cards (often around 15 seconds), and{" "}
          <strong className="font-medium text-zinc-300">dual roles</strong> (e.g. producer
          and DJ) from one profile. Until those ship, treat off-platform payments and
          deals as <strong className="font-medium text-zinc-300">your own risk</strong>.
        </p>
        <p>
          <strong className="font-medium text-zinc-300">Points for real engagement (planned)</strong>
          : the more you post and engage, the more points you build. Later, you can cash
          those points in for lead-generation and reach-out credits—so you can
          message executives and top-tier creatives without relying on follower
          counts. Details will ship when the product is ready.
        </p>
        <p>
          <strong className="font-medium text-zinc-300">In-app beat and bundle sales</strong>{" "}
          are planned so checkout can stay credible inside prodLink. We&apos;ll share
          updates as they ship.
        </p>
        <p>
          On <strong className="font-medium text-zinc-300">pricing</strong>, we&apos;re
          aiming for fair access—not a steep monthly gate like some creator platforms.
          Specifics will come with paid features.
        </p>
      </div>
    </article>
  );
}
