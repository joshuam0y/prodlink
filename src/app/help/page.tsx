import type { Metadata } from "next";
import Link from "next/link";
import { getSupportEmail } from "@/lib/env";

export const metadata: Metadata = {
  title: "Help center",
  description:
    "prodLink help: beta, discover (distance, sorts), optional dual roles and SoundCloud, card audio previews, safety, pricing, support.",
};

export default function HelpPage() {
  const email = getSupportEmail();
  const mailto =
    email.length > 0
      ? `mailto:${encodeURIComponent(email)}?subject=${encodeURIComponent("prodLink question")}`
      : null;

  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight text-zinc-50">Help center</h1>
      <p className="mt-2 text-sm leading-relaxed text-zinc-400">
        Questions about profiles, discover, or your account? Reach out and we will get back
        to you.
      </p>

      <section className="mt-8 rounded-2xl border border-white/10 bg-zinc-900/35 p-6">
        <h2 className="text-sm font-semibold text-zinc-100">Common questions</h2>
        <dl className="mt-4 space-y-5 text-sm leading-relaxed text-zinc-400">
          <div>
            <dt className="font-medium text-zinc-200">Is prodLink finished?</dt>
            <dd className="mt-1.5">
              No—we&apos;re in <strong className="font-medium text-zinc-300">beta</strong>.
              Features and policies will evolve; we&apos;re building with early users and
              feedback.
            </dd>
          </div>
          <div>
            <dt className="font-medium text-zinc-200">Who is prodLink for?</dt>
            <dd className="mt-1.5">
              Especially{" "}
              <strong className="font-medium text-zinc-300">
                emerging artists, producers, and DJs
              </strong>{" "}
              who want collaborators and gigs{" "}
              <strong className="font-medium text-zinc-300">nearby</strong>, not another
              global popularity contest. Venues and engineers are welcome too.
            </dd>
          </div>
          <div>
            <dt className="font-medium text-zinc-200">Can I buy or sell beats in the app?</dt>
            <dd className="mt-1.5">
              <strong className="font-medium text-zinc-300">In-app checkout is not live yet.</strong>{" "}
              We plan <strong className="font-medium text-zinc-300">in-app sales for beats and bundles</strong>{" "}
              so buyers and sellers can transact with clearer records inside prodLink. Until
              that ships, anything you arrange off-platform is between you and the other party.
            </dd>
          </div>
          <div>
            <dt className="font-medium text-zinc-200">What&apos;s on the roadmap?</dt>
            <dd className="mt-1.5 space-y-3">
              <p>
                We ship in layers. Some items below are{" "}
                <strong className="font-medium text-zinc-300">already in the app</strong> (your
                build may turn them on gradually); others are{" "}
                <strong className="font-medium text-zinc-300">still coming</strong>.
              </p>
              <ul className="list-inside list-disc space-y-2 pl-0.5 text-zinc-400">
                <li>
                  <strong className="font-medium text-zinc-300">Short audio on discover cards</strong> —{" "}
                  <strong className="font-medium text-zinc-300">In the app:</strong> playable
                  previews with a short cap (often around{" "}
                  <strong className="font-medium text-zinc-300">15 seconds</strong>) when enabled.
                </li>
                <li>
                  <strong className="font-medium text-zinc-300">Trust &amp; verification</strong> —{" "}
                  <strong className="font-medium text-zinc-300">In the app:</strong> optional{" "}
                  <strong className="font-medium text-zinc-300">SoundCloud</strong> link on your profile
                  when that section is enabled. <strong className="font-medium text-zinc-300">Not yet:</strong>{" "}
                  government ID or automated face checks.
                </li>
                <li>
                  <strong className="font-medium text-zinc-300">Labels &amp; pitching</strong> —{" "}
                  <strong className="font-medium text-zinc-300">In the app:</strong> you can choose a{" "}
                  <strong className="font-medium text-zinc-300">record label</strong> role in onboarding
                  when enabled. <strong className="font-medium text-zinc-300">Not yet:</strong> dedicated
                  in-app pitching workflows—those are still planned.
                </li>
                <li>
                  <strong className="font-medium text-zinc-300">Dual roles</strong> —{" "}
                  <strong className="font-medium text-zinc-300">In the app:</strong> an optional second
                  role (e.g. producer and DJ) so discover and profiles can show a combined line like{" "}
                  <strong className="font-medium text-zinc-300">Producer · DJ</strong> when enabled.
                </li>
                <li>
                  <strong className="font-medium text-zinc-300">Discover &amp; proximity</strong> —{" "}
                  <strong className="font-medium text-zinc-300">In beta today:</strong> distance filter
                  and sorts including <strong className="font-medium text-zinc-300">nearby</strong>,{" "}
                  <strong className="font-medium text-zinc-300">trending</strong>, and{" "}
                  <strong className="font-medium text-zinc-300">new</strong>.{" "}
                  <strong className="font-medium text-zinc-300">Still coming:</strong> more
                  neighborhood-focused options and refinements.
                </li>
                <li>
                  <strong className="font-medium text-zinc-300">In-app commerce</strong> — checkout for
                  beats and bundles inside prodLink when we&apos;re ready to ship it.
                </li>
                <li>
                  <strong className="font-medium text-zinc-300">Fair pricing</strong> — paid plans tied to
                  real features; we want to avoid a steep monthly gate.
                </li>
                <li>
                  <strong className="font-medium text-zinc-300">Beta supporters</strong> — early users may
                  see <strong className="font-medium text-zinc-300">beta perks</strong> messaging as major
                  features land.
                </li>
              </ul>
            </dd>
          </div>
          <div>
            <dt className="font-medium text-zinc-200">Will there be short audio clips on cards?</dt>
            <dd className="mt-1.5">
              <strong className="font-medium text-zinc-300">Yes—this is in the product.</strong> Discover
              cards can play short previews (often around{" "}
              <strong className="font-medium text-zinc-300">15 seconds</strong>) when that behavior is
              enabled for your app, so people hear your work in flow.
            </dd>
          </div>
          <div>
            <dt className="font-medium text-zinc-200">What about verification?</dt>
            <dd className="mt-1.5">
              You can add an optional <strong className="font-medium text-zinc-300">SoundCloud</strong>{" "}
              link on your profile when that option is available—useful context, not a full identity
              check. <strong className="font-medium text-zinc-300">Government ID</strong> and{" "}
              <strong className="font-medium text-zinc-300">face verification</strong> are not live yet;
              we&apos;re working toward stronger trust tools over time.
            </dd>
          </div>
          <div>
            <dt className="font-medium text-zinc-200">Will labels and pitching be in prodLink?</dt>
            <dd className="mt-1.5">
              A <strong className="font-medium text-zinc-300">record label</strong> role is available in
              onboarding when enabled. Dedicated{" "}
              <strong className="font-medium text-zinc-300">in-app pitching</strong> to labels—{" "}
              <strong className="font-medium text-zinc-300">genre-agnostic</strong>—is still planned;
              timing TBD.
            </dd>
          </div>
          <div>
            <dt className="font-medium text-zinc-200">Can one person be both a producer and a DJ?</dt>
            <dd className="mt-1.5">
              <strong className="font-medium text-zinc-300">Yes when dual roles are enabled:</strong> you
              can set a primary role and an optional second role so discover and public profiles can show
              both (e.g. <strong className="font-medium text-zinc-300">Producer · DJ</strong>).
            </dd>
          </div>
          <div>
            <dt className="font-medium text-zinc-200">How does discover handle distance?</dt>
            <dd className="mt-1.5">
              In beta you can <strong className="font-medium text-zinc-300">filter by distance</strong>{" "}
              and use sorts like <strong className="font-medium text-zinc-300">nearby</strong>,{" "}
              <strong className="font-medium text-zinc-300">trending</strong>, and{" "}
              <strong className="font-medium text-zinc-300">new</strong>. We&apos;re still improving
              tighter neighborhood-style discovery on top of that.
            </dd>
          </div>
          <div>
            <dt className="font-medium text-zinc-200">How will pricing work?</dt>
            <dd className="mt-1.5">
              We&apos;re aiming for <strong className="font-medium text-zinc-300">fair access</strong>{" "}
              and want to avoid a steep monthly gate like some creator platforms. Paid
              details will ship with the features they support.
            </dd>
          </div>
          <div>
            <dt className="font-medium text-zinc-200">How should I stay safe?</dt>
            <dd className="mt-1.5">
              Be cautious of scams and fake profiles—never assume someone is who they claim
              without checking.               We&apos;re working toward stronger verification and clearer in-app tools over
              time (optional profile links like SoundCloud are a start, not proof of ID); until
              then, use the same judgment you would anywhere online.
            </dd>
          </div>
        </dl>
      </section>

      <section className="mt-6 rounded-2xl border border-white/10 bg-zinc-900/35 p-6">
        <h2 className="text-sm font-semibold text-zinc-100">Contact us</h2>
        {mailto ? (
          <p className="mt-3 text-sm leading-relaxed text-zinc-400">
            Email{" "}
            <a href={mailto} className="font-medium text-amber-400/95 underline-offset-2 hover:underline">
              {email}
            </a>
            . You can describe your question in your mail app before sending.
          </p>
        ) : (
          <p className="mt-3 text-sm leading-relaxed text-zinc-400">
            Set{" "}
            <code className="rounded bg-white/5 px-1.5 py-0.5 text-xs text-zinc-300">
              NEXT_PUBLIC_SUPPORT_EMAIL
            </code>{" "}
            in your environment to show a support address here.
          </p>
        )}
      </section>

      <section className="mt-6 rounded-2xl border border-white/10 bg-zinc-900/35 p-6">
        <h2 className="text-sm font-semibold text-zinc-100">Quick links</h2>
        <ul className="mt-3 list-inside list-disc space-y-2 text-sm text-zinc-400">
          <li>
            <Link href="/how-it-works" className="text-amber-400/95 hover:underline">
              How prodLink works
            </Link>
          </li>
          <li>
            <Link href="/profile" className="text-amber-400/95 hover:underline">
              Edit your profile &amp; privacy
            </Link>
          </li>
          <li>
            <Link href="/explore" className="text-amber-400/95 hover:underline">
              Discover
            </Link>
          </li>
        </ul>
      </section>
    </main>
  );
}
