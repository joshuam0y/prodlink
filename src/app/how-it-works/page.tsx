import Link from "next/link";
import { ProdlinkSocialStrip } from "@/components/prodlink-social-strip";

const topics = [
  {
    href: "/how-it-works/profile",
    title: "Your profile",
    blurb: "What to put on your card so the right people find you.",
  },
  {
    href: "/how-it-works/discover",
    title: "Discover",
    blurb: "How the feed works and how to use filters without overthinking.",
  },
  {
    href: "/how-it-works/connect",
    title: "Match & message",
    blurb: "Saving people, chatting, and staying on top of replies.",
  },
  {
    href: "/how-it-works/roles",
    title: "Who it's for",
    blurb: "Artists, producers, DJs, venues—how each role shows up.",
  },
  {
    href: "/how-it-works/roadmap",
    title: "Beta & roadmap",
    blurb: "What’s live, what’s next, safety, and pricing direction.",
  },
] as const;

export default function HowItWorksOverviewPage() {
  return (
    <>
      <section className="rounded-[32px] border border-white/10 bg-zinc-900/45 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.22)] sm:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-300/90">
          How prodLink works · beta
        </p>
        <h1 className="mt-3 max-w-2xl text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">
          Most of the people you’ll actually work with are nearby. That’s the whole idea.
        </h1>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base">
          prodLink is for meeting artists, producers, and DJs in your scene—specific
          profiles, local discovery when you want it, and audio so you can hear the fit
          before you DM.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/explore"
            className="inline-flex rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-amber-400"
          >
            Open Discover
          </Link>
          <Link
            href="/onboarding"
            className="inline-flex rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-sm font-medium text-zinc-200 transition hover:bg-white/10"
          >
            Build your profile
          </Link>
        </div>
        <div className="mt-8 border-t border-white/10 pt-6">
          <ProdlinkSocialStrip />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="text-lg font-semibold text-zinc-100 sm:text-xl">
          Pick a topic
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-zinc-500">
          Each section goes deeper on one part of the app—open a card and read at your
          own pace.
        </p>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2">
          {topics.map((topic) => (
            <li key={topic.href}>
              <Link
                href={topic.href}
                className="block rounded-2xl border border-white/10 bg-zinc-900/35 p-5 transition hover:border-amber-500/25 hover:bg-zinc-900/50"
              >
                <span className="font-semibold text-zinc-100">{topic.title}</span>
                <p className="mt-2 text-sm leading-relaxed text-zinc-500">{topic.blurb}</p>
                <span className="mt-3 inline-block text-sm font-medium text-amber-400/95">
                  Read more →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
