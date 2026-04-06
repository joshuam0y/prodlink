import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Who it's for",
};

const roles = [
  "Artists can show personality, sound, and who they want to work with.",
  "Producers and engineers can lead with their taste, sessions, and what kind of artists they help best.",
  "DJs can highlight their energy, rooms, and the scenes they fit.",
  "Venues and promoters can stay focused on talent discovery and booking fit.",
  "Record labels (planned): a dedicated path for genre-agnostic track pitching—not locked to one house or scene.",
];

export default function HowItWorksRolesPage() {
  return (
    <article className="rounded-3xl border border-white/10 bg-zinc-900/35 p-6 sm:p-8">
      <Link
        href="/how-it-works"
        className="text-sm font-medium text-amber-400/95 underline-offset-4 transition hover:underline"
      >
        ← How it works overview
      </Link>
      <h1 className="mt-6 text-2xl font-semibold tracking-tight text-zinc-50 sm:text-3xl">
        Who can we help?
      </h1>
      <ul className="mt-6 space-y-3 text-sm leading-relaxed text-zinc-400 sm:text-base">
        {roles.map((role) => (
          <li key={role}>{role}</li>
        ))}
      </ul>
    </article>
  );
}
