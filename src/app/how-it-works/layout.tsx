import type { Metadata } from "next";
import { HowItWorksNav } from "@/components/how-it-works-nav";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "How prodLink works: nearby discovery, profile audio, matches. Roadmap: ~15s card previews, ID + linked SoundCloud, Stripe Connect / Plaid, labels role, dual roles, tighter proximity.",
};

export default function HowItWorksLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-4 py-10 sm:px-6 lg:flex-row lg:gap-10">
      <HowItWorksNav />
      <div className="min-w-0 flex-1">{children}</div>
    </main>
  );
}
