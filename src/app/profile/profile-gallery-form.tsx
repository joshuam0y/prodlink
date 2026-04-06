"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { parseGalleryImageUrls } from "@/lib/profile-gallery";
import { updateProfileGalleryImages } from "./actions";

const fieldClass =
  "mt-1.5 w-full rounded-xl border border-white/10 bg-zinc-900/50 px-4 py-2.5 text-sm text-zinc-200 file:mr-3 file:rounded-lg file:border-0 file:bg-amber-500/20 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-amber-200 placeholder:text-zinc-600 focus:border-amber-500/50 focus:outline-none focus:ring-1 focus:ring-amber-500/30";

const MAX = 6;

function extFromFile(file: File): string {
  const byName = file.name.split(".").pop()?.toLowerCase();
  if (byName && byName.length <= 5 && /^[a-z0-9]+$/i.test(byName)) return byName;
  if (file.type.includes("webp")) return "webp";
  if (file.type.includes("png")) return "png";
  return "jpg";
}

async function uploadGalleryImage(userId: string, file: File): Promise<string> {
  const supabase = createBrowserSupabaseClient();
  const ext = extFromFile(file);
  const path = `${userId}/gallery-${Date.now()}.${ext}`;
  const { error } = await supabase.storage
    .from("profile-media")
    .upload(path, file, { upsert: false, contentType: file.type || undefined });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from("profile-media").getPublicUrl(path);
  return data.publicUrl;
}

export function ProfileGalleryForm({ initialUrls }: { initialUrls: unknown }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [urls, setUrls] = useState(() => parseGalleryImageUrls(initialUrls));
  const [message, setMessage] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const persist = (next: string[]) => {
    startTransition(async () => {
      const result = await updateProfileGalleryImages(next);
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      setUrls(next);
      setMessage("Gallery updated.");
      router.refresh();
    });
  };

  return (
    <section className="mt-10 rounded-2xl border border-white/10 bg-zinc-900/40 p-6">
      <h2 className="text-sm font-semibold text-zinc-100">More photos</h2>
      <p className="mt-1 text-sm text-zinc-500">
        Add up to {MAX} images for your public profile gallery (shown alongside your main photo and track previews).
      </p>

      {message ? (
        <p className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200/95">
          {message}
        </p>
      ) : null}

      {urls.length > 0 ? (
        <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {urls.map((url) => (
            <li key={url} className="relative aspect-square overflow-hidden rounded-xl border border-white/10 bg-zinc-950/50">
              <Image src={url} alt="" fill className="object-cover" unoptimized />
              <button
                type="button"
                disabled={pending}
                onClick={() => persist(urls.filter((u) => u !== url))}
                className="absolute bottom-2 right-2 rounded-full border border-white/20 bg-black/60 px-2 py-1 text-[11px] font-medium text-zinc-100 backdrop-blur-sm transition hover:bg-black/80"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {urls.length < MAX ? (
        <div className="mt-5">
          <label className="block text-xs font-medium text-zinc-500">
            Add image
            <input
              type="file"
              accept="image/*"
              disabled={pending}
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className={fieldClass}
            />
          </label>
          <button
            type="button"
            disabled={pending || !file}
            onClick={() => {
              if (!file) return;
              startTransition(async () => {
                try {
                  const supabase = createBrowserSupabaseClient();
                  const {
                    data: { user },
                  } = await supabase.auth.getUser();
                  if (!user) {
                    setMessage("Sign in to add photos.");
                    return;
                  }
                  const uploaded = await uploadGalleryImage(user.id, file);
                  const next = [...urls, uploaded].slice(0, MAX);
                  const result = await updateProfileGalleryImages(next);
                  if (!result.ok) {
                    setMessage(result.error);
                    return;
                  }
                  setUrls(next);
                  setFile(null);
                  setMessage("Photo added.");
                  router.refresh();
                } catch (error) {
                  setMessage(error instanceof Error ? error.message : "Upload failed.");
                }
              });
            }}
            className="mt-3 rounded-full bg-amber-500 px-4 py-2 text-sm font-semibold text-zinc-950 transition hover:bg-amber-400 disabled:opacity-40"
          >
            {pending ? "Uploading…" : "Upload"}
          </button>
        </div>
      ) : (
        <p className="mt-4 text-xs text-zinc-500">Maximum {MAX} extra photos reached. Remove one to add another.</p>
      )}
    </section>
  );
}
