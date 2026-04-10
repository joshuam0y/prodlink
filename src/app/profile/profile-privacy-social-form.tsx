"use client";

import { useState, useTransition } from "react";
import { SocialPlatformSelect } from "@/components/social-platform-select";
import type { PublicVisibilityKey } from "@/lib/public-visibility";
import { isPublicFieldVisible } from "@/lib/public-visibility";
import type { KnownSocialPlatformId } from "@/lib/social-platforms-data";
import { matchLabelToPlatformId, platformIdToLabel } from "@/lib/social-platforms-data";
import type { SocialLink } from "@/lib/social-links";
import { updateProfilePrivacySocial } from "./actions";

type Props = {
  initialVisibility: unknown;
  initialLinks: SocialLink[];
};

type LinkRow = {
  platformId: KnownSocialPlatformId | null;
  customLabel: string;
  url: string;
};

const fieldClass =
  "mt-1 w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-500 focus:border-amber-500/60 focus:outline-none focus:ring-1 focus:ring-amber-500/30 dark:border-white/10 dark:bg-zinc-900/50 dark:text-zinc-200 dark:placeholder:text-zinc-600";

const selectButtonClass = `${fieldClass} flex items-center justify-between gap-2`;

const toggles: { key: PublicVisibilityKey; label: string; hint: string }[] = [
  {
    key: "member_details",
    label: "Member details",
    hint: "Signed up and last seen on your public profile.",
  },
  {
    key: "location",
    label: "Location",
    hint: "City, neighborhood, and distance when someone views your profile.",
  },
  { key: "goal", label: "Current focus / goal", hint: "Your goal section on the public page." },
  {
    key: "looking_for",
    label: "Looking for",
    hint: "The “looking for” or booking-fit block.",
  },
  { key: "prompts", label: "Prompts", hint: "Both profile prompts and answers." },
  { key: "niche", label: "Sound / style", hint: "Style line and sound section when shown." },
  {
    key: "beats",
    label: "Tracks & photos",
    hint: "Featured track, extra previews, and gallery media from those previews.",
  },
];

function initialVisible(key: PublicVisibilityKey, raw: unknown): boolean {
  return isPublicFieldVisible(key, raw);
}

function linksToRows(links: SocialLink[]): LinkRow[] {
  if (!links.length) return [{ platformId: null, customLabel: "", url: "" }];
  return links.map((l) => {
    const id = matchLabelToPlatformId(l.label);
    if (id === "custom") {
      return { platformId: "custom", customLabel: l.label, url: l.url };
    }
    return { platformId: id, customLabel: "", url: l.url };
  });
}

function rowsToSocialLinks(rows: LinkRow[]): SocialLink[] {
  const out: SocialLink[] = [];
  for (const r of rows) {
    if (!r.platformId) continue;
    const label = platformIdToLabel(r.platformId, r.customLabel).trim();
    const url = r.url.trim();
    if (!label || !url) continue;
    out.push({ label, url });
  }
  return out;
}

function disabledPlatformIdsForRow(rows: LinkRow[], index: number): Set<string> {
  const s = new Set<string>();
  rows.forEach((row, i) => {
    if (i === index) return;
    if (row.platformId && row.platformId !== "custom") {
      s.add(row.platformId);
    }
  });
  return s;
}

export function ProfilePrivacySocialForm({ initialVisibility, initialLinks }: Props) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [vis, setVis] = useState<Record<PublicVisibilityKey, boolean>>(() => {
    const o = {} as Record<PublicVisibilityKey, boolean>;
    for (const { key } of toggles) {
      o[key] = initialVisible(key, initialVisibility);
    }
    return o;
  });
  const [rows, setRows] = useState<LinkRow[]>(() => linksToRows(initialLinks));

  function setRow(index: number, patch: Partial<LinkRow>) {
    setRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], ...patch };
      return next;
    });
  }

  function addLink() {
    if (rows.length >= 6) return;
    setRows((prev) => [...prev, { platformId: null, customLabel: "", url: "" }]);
  }

  function removeLink(index: number) {
    setRows((prev) =>
      prev.length <= 1 ? [{ platformId: null, customLabel: "", url: "" }] : prev.filter((_, i) => i !== index),
    );
  }

  function save() {
    setMessage(null);
    const cleaned = rowsToSocialLinks(rows);
    startTransition(async () => {
      const res = await updateProfilePrivacySocial({
        visibility: vis,
        social_links: cleaned,
      });
      setMessage(res.ok ? "Saved." : res.error);
    });
  }

  return (
    <section className="mt-8 rounded-2xl border border-zinc-300 bg-white/85 p-5 sm:p-6 dark:border-white/10 dark:bg-zinc-900/35">
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Public profile &amp; links</h2>
      <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-400">
        Choose what appears on your public page. Discover may still use your style and prompts for matching.
      </p>

      <fieldset className="mt-6 space-y-4">
        <legend className="text-xs font-medium uppercase tracking-wider text-zinc-700 dark:text-zinc-400">
          Visible on public profile
        </legend>
        {toggles.map(({ key, label, hint }) => (
          <label
            key={key}
            className="flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-300/80 bg-white/70 px-4 py-3 dark:border-white/5 dark:bg-zinc-950/30"
          >
            <input
              type="checkbox"
              className="mt-1 h-4 w-4 rounded border-zinc-300 bg-white text-amber-500 focus:ring-amber-500/40 dark:border-white/20 dark:bg-zinc-900"
              checked={vis[key]}
              onChange={(e) => setVis((s) => ({ ...s, [key]: e.target.checked }))}
            />
            <span>
              <span className="font-medium text-zinc-800 dark:text-zinc-200">{label}</span>
              <span className="mt-0.5 block text-xs text-zinc-600 dark:text-zinc-500">{hint}</span>
            </span>
          </label>
        ))}
      </fieldset>

      <div className="mt-8">
        <h3 className="text-xs font-medium uppercase tracking-wider text-zinc-700 dark:text-zinc-400">Social &amp; web links</h3>
        <p className="mt-1 text-sm text-zinc-700 dark:text-zinc-400">
          Pick a platform, then paste your <code className="text-zinc-600 dark:text-zinc-300">https://</code> link. Each platform
          can only appear once. For anything else, choose{" "}
          <strong className="font-medium text-zinc-700 dark:text-zinc-300">Custom label…</strong> and type a short name.
        </p>
        <ul className="mt-4 space-y-4">
          {rows.map((row, index) => (
            <li key={index} className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_auto] sm:items-start">
                <div className="min-w-0">
                  <span className="text-xs text-zinc-700 dark:text-zinc-400">Platform</span>
                  <div className="mt-1.5">
                    <SocialPlatformSelect
                      value={row.platformId}
                      onChange={(id) => setRow(index, { platformId: id, customLabel: id === "custom" ? row.customLabel : "" })}
                      disabledPlatformIds={disabledPlatformIdsForRow(rows, index)}
                      buttonClassName={selectButtonClass}
                    />
                  </div>
                </div>
                <div className="min-w-0">
                  <label className="text-xs text-zinc-700 dark:text-zinc-400" htmlFor={`social-url-${index}`}>
                    URL
                  </label>
                  <input
                    id={`social-url-${index}`}
                    className={fieldClass}
                    value={row.url}
                    onChange={(e) => setRow(index, { url: e.target.value })}
                    placeholder="https://…"
                    inputMode="url"
                    autoComplete="url"
                  />
                </div>
                <button
                  type="button"
                  className="rounded-xl border border-zinc-300/80 bg-white px-3 py-2.5 text-sm text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-900 sm:mt-6 dark:border-white/10 dark:bg-transparent dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-zinc-200"
                  onClick={() => removeLink(index)}
                >
                  Remove
                </button>
              </div>
              {row.platformId === "custom" ? (
                <div>
                  <label className="text-xs text-zinc-700 dark:text-zinc-400" htmlFor={`social-custom-${index}`}>
                    Custom label
                  </label>
                  <input
                    id={`social-custom-${index}`}
                    className={fieldClass}
                    value={row.customLabel}
                    onChange={(e) => setRow(index, { customLabel: e.target.value })}
                    placeholder="e.g. Link-in-bio, Press kit"
                    maxLength={48}
                    autoComplete="off"
                  />
                </div>
              ) : null}
            </li>
          ))}
        </ul>
        {rows.length < 6 ? (
          <button
            type="button"
            className="mt-3 text-sm font-medium text-amber-400/90 hover:text-amber-300"
            onClick={addLink}
          >
            + Add link
          </button>
        ) : null}
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          disabled={pending}
          onClick={save}
          className="inline-flex justify-center rounded-full bg-amber-500 px-5 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-amber-400 disabled:opacity-60"
        >
          {pending ? "Saving…" : "Save privacy & links"}
        </button>
        {message ? (
          <p className={`text-sm ${message === "Saved." ? "text-emerald-400/90" : "text-red-400/90"}`}>
            {message}
          </p>
        ) : null}
      </div>
    </section>
  );
}
