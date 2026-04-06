"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  isBetaPerksUiEnabled,
  isDualRolesEnabled,
  isSoundcloudFieldEnabled,
} from "@/lib/roadmap-features";
import { updateProfileBasics } from "./actions";

const fieldClass =
  "mt-1.5 w-full rounded-xl border border-white/10 bg-zinc-900/50 px-4 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30";

const SECONDARY_OPTIONS = [
  "",
  "Producer",
  "Artist / vocalist",
  "DJ",
  "Engineer",
  "Venue / promoter",
  "Record label",
] as const;

function isValidSoundcloudUrl(raw: string): boolean {
  const s = raw.trim();
  if (!s) return true;
  try {
    const u = new URL(s);
    return u.protocol === "https:" && u.hostname.includes("soundcloud.com");
  } catch {
    return false;
  }
}

type Props = {
  primaryRole: string;
  initialSecondaryRole: string | null;
  initialSoundcloudUrl: string | null;
};

export function ProfileRoadmapFields({ primaryRole, initialSecondaryRole, initialSoundcloudUrl }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [secondary, setSecondary] = useState(initialSecondaryRole?.trim() ?? "");
  const [soundcloud, setSoundcloud] = useState(initialSoundcloudUrl?.trim() ?? "");
  const [message, setMessage] = useState<string | null>(null);

  const showDual = isDualRolesEnabled();
  const showSc = isSoundcloudFieldEnabled();
  const showBeta = isBetaPerksUiEnabled();

  if (!showDual && !showSc && !showBeta) return null;

  return (
    <section className="mt-10 rounded-2xl border border-white/10 bg-zinc-900/40 p-6">
      <h2 className="text-sm font-semibold text-zinc-100">Roadmap profile options</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Optional fields tied to upcoming prodLink features (toggle via env in production).
      </p>

      {showBeta ? (
        <p className="mt-4 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 text-sm text-amber-100/95">
          <strong className="font-medium text-amber-50">Beta supporter</strong> — thanks for
          helping shape prodLink. Perks will roll out as major features ship.
        </p>
      ) : null}

      {showDual ? (
        <div className="mt-5">
          <label htmlFor="secondary_role" className="text-xs font-medium text-zinc-500">
            Second role (optional)
          </label>
          <select
            id="secondary_role"
            value={secondary}
            onChange={(e) => setSecondary(e.target.value)}
            className={fieldClass}
          >
            {SECONDARY_OPTIONS.map((opt) => (
              <option key={opt || "none"} value={opt}>
                {opt || "None"}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-zinc-600">
            Shown as &quot;{primaryRole} · …&quot; on discover when different from your primary role.
          </p>
        </div>
      ) : null}

      {showSc ? (
        <div className={showDual ? "mt-5" : "mt-5"}>
          <label htmlFor="soundcloud_url" className="text-xs font-medium text-zinc-500">
            SoundCloud profile URL (optional)
          </label>
          <input
            id="soundcloud_url"
            type="url"
            inputMode="url"
            placeholder="https://soundcloud.com/your-page"
            value={soundcloud}
            onChange={(e) => setSoundcloud(e.target.value)}
            className={fieldClass}
          />
          <p className="mt-1 text-xs text-zinc-600">
            HTTPS link to your SoundCloud — used for future verification flows.
          </p>
        </div>
      ) : null}

      {message ? (
        <p className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200/95">
          {message}
        </p>
      ) : null}

      {(showDual || showSc) && (
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            if (showSc && soundcloud.trim() && !isValidSoundcloudUrl(soundcloud)) {
              setMessage("SoundCloud URL must be a valid https://soundcloud.com link.");
              return;
            }
            startTransition(async () => {
              const payload: Parameters<typeof updateProfileBasics>[0] = {};
              if (showDual) {
                const sec = secondary.trim();
                const pri = primaryRole.trim().toLowerCase();
                const secLower = sec.toLowerCase();
                if (sec && secLower === pri) {
                  setMessage("Pick a second role different from your primary, or leave blank.");
                  return;
                }
                payload.secondary_role = sec || null;
              }
              if (showSc) {
                payload.soundcloud_url = soundcloud.trim() || null;
              }
              const result = await updateProfileBasics(payload);
              if (!result.ok) {
                setMessage(result.error);
                return;
              }
              setMessage("Saved.");
              router.refresh();
            });
          }}
          className="mt-5 rounded-full bg-amber-500 px-5 py-2.5 text-sm font-semibold text-zinc-950 transition hover:bg-amber-400 disabled:opacity-40"
        >
          {pending ? "Saving…" : "Save roadmap fields"}
        </button>
      )}
    </section>
  );
}
