import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  redeemOutreachCreditsAction,
  resetAllOutreachCreditsAction,
} from "@/app/points/actions";
import { isSupabaseConfigured } from "@/lib/env";
import { getOutreachCreditsBalance, OUTREACH_REDEEM_OPTIONS } from "@/lib/outreach-credits";
import { getPointsBalance } from "@/lib/points";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Points and credits",
  description: "Redeem engagement points for outreach credits.",
};

export default async function PointsPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  if (!isSupabaseConfigured()) redirect("/?error=supabase");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/points");

  const params = await searchParams;
  const notice = params.notice ? decodeURIComponent(params.notice) : null;
  const [pointsBalance, outreachCredits] = await Promise.all([
    getPointsBalance(supabase, user.id),
    getOutreachCreditsBalance(supabase, user.id),
  ]);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Points and outreach credits</h1>
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
        Earn points from activity, then redeem them into outreach credits you can use for lead-gen access.
      </p>
      {notice ? (
        <p className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-sm text-amber-900 dark:text-amber-100">
          {notice}
        </p>
      ) : null}

      <section className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="rounded-2xl border border-zinc-300/80 bg-white/90 p-4 dark:border-white/10 dark:bg-zinc-900/35">
          <p className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-500">Points balance</p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{pointsBalance}</p>
        </div>
        <div className="rounded-2xl border border-zinc-300/80 bg-white/90 p-4 dark:border-white/10 dark:bg-zinc-900/35">
          <p className="text-xs uppercase tracking-wider text-zinc-500 dark:text-zinc-500">Outreach credits</p>
          <p className="mt-1 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{outreachCredits}</p>
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-zinc-300/80 bg-white/90 p-4 dark:border-white/10 dark:bg-zinc-900/35">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
          Redeem options
        </h2>
        <div className="mt-3 space-y-3">
          {OUTREACH_REDEEM_OPTIONS.map((opt) => (
            <form
              key={`${opt.points}-${opt.credits}`}
              action={redeemOutreachCreditsAction}
              className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 bg-white px-3 py-3 dark:border-white/10 dark:bg-zinc-950/25"
            >
              <input type="hidden" name="option" value={`${opt.points}:${opt.credits}`} />
              <p className="text-sm text-zinc-700 dark:text-zinc-300">
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">{opt.points} points</span>
                {" -> "}
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">{opt.credits} outreach credits</span>
                <span className="ml-2 text-xs text-zinc-500 dark:text-zinc-400">
                  (limit {opt.maxPerDay}/day)
                </span>
              </p>
              <button
                type="submit"
                disabled={pointsBalance < opt.points}
                className="rounded-full border border-amber-500/35 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-900 transition hover:bg-amber-500/20 disabled:opacity-50 dark:text-amber-200 dark:hover:bg-amber-500/15"
              >
                Redeem
              </button>
            </form>
          ))}
        </div>
      </section>

      <section className="mt-6 rounded-2xl border border-zinc-300/80 bg-white/90 p-4 dark:border-white/10 dark:bg-zinc-900/35">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
          Credits reset
        </h2>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
          Need a clean slate for testing? Reset your outreach credits back to zero.
        </p>
        <form action={resetAllOutreachCreditsAction} className="mt-3">
          <button
            type="submit"
            className="rounded-full border border-red-500/35 bg-red-500/10 px-3 py-1.5 text-xs font-semibold text-red-900 transition hover:bg-red-500/20 dark:text-red-200 dark:hover:bg-red-500/15"
          >
            Reset all outreach credits
          </button>
        </form>
      </section>

      <section className="mt-6 rounded-2xl border border-zinc-300/80 bg-white/90 p-4 dark:border-white/10 dark:bg-zinc-900/35">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
          How it works
        </h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-zinc-600 dark:text-zinc-400">
          <li>Points are earned from real engagement actions.</li>
          <li>Daily like limits apply; passes do not consume like allowance.</li>
          <li>Redeeming converts points into outreach credits.</li>
          <li>Credits are your spendable balance for future outreach features.</li>
        </ul>
      </section>

      <div className="mt-6">
        <Link
          href="/explore"
          className="inline-flex rounded-full border border-zinc-300/80 bg-white/90 px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-100 dark:border-white/10 dark:bg-white/5 dark:text-zinc-200 dark:hover:bg-white/10"
        >
          Back to Discover
        </Link>
      </div>
    </main>
  );
}
