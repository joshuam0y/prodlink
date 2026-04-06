import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Match & message",
};

export default function HowItWorksConnectPage() {
  return (
    <article className="rounded-3xl border border-white/10 bg-zinc-900/35 p-6 sm:p-8">
      <Link
        href="/how-it-works"
        className="text-sm font-medium text-amber-400/95 underline-offset-4 transition hover:underline"
      >
        ← How it works overview
      </Link>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">
        Match and message
      </h1>
      <div className="mt-6 space-y-4 text-sm leading-relaxed text-zinc-400 sm:text-base">
        <p>
          Save people you want to keep, message your matches, and use notifications so
          you don&apos;t miss a reply.
        </p>
      </div>
    </article>
  );
}
