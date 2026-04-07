"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { trackServerEvent } from "@/lib/analytics";
import { createNotification } from "@/lib/notifications";
import { awardPoints, POINT_VALUES, spendPoints } from "@/lib/points";
import { isUuid } from "@/lib/uuid";

export type DiscoverAction = "pass" | "save";
const DAILY_LIKE_LIMIT = 25;

async function hasReachedDailyLikeLimit(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<boolean> {
  const now = new Date();
  const dayStartIso = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0),
  ).toISOString();
  const { count } = await supabase
    .from("discover_swipes")
    .select("viewer_id", { count: "exact", head: true })
    .eq("viewer_id", userId)
    .in("action", ["save", "interested"])
    .gte("created_at", dayStartIso);
  return (count ?? 0) >= DAILY_LIKE_LIMIT;
}

async function getActorName(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
): Promise<string> {
  const { data } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", userId)
    .maybeSingle();
  return data?.display_name?.trim() || "Someone";
}

async function maybeNotifyForSave(
  supabase: Awaited<ReturnType<typeof createClient>>,
  actorId: string,
  targetId: string,
): Promise<boolean> {
  const actorName = await getActorName(supabase, actorId);

  await createNotification({
    userId: targetId,
    actorId,
    kind: "profile_saved",
    title: `${actorName} liked you`,
    body: "Open Likes to see who is interested.",
    href: "/likes",
    metadata: { actorId },
  });

  const { data: reciprocal } = await supabase
    .from("discover_swipes")
    .select("viewer_id")
    .eq("viewer_id", targetId)
    .eq("target_id", actorId)
    .in("action", ["save", "interested"])
    .maybeSingle();

  const matched = Boolean(reciprocal);
  if (!matched) return false;

  await trackServerEvent({
    event: "match_created",
    path: "/explore",
    metadata: { targetId },
  });

  await createNotification({
    userId: targetId,
    actorId,
    kind: "match_created",
    title: `You matched with ${actorName}`,
    body: "Open Messages to start the conversation.",
    href: `/matches/${actorId}`,
    metadata: { actorId },
  });
  await createNotification({
    userId: actorId,
    actorId: targetId,
    kind: "match_created",
    title: "It’s a match",
    body: "You have a new mutual match. Open Messages to chat.",
    href: `/matches/${targetId}`,
    metadata: { actorId: targetId },
  });

  const pair = [actorId, targetId].sort().join(":");
  await awardPoints(
    supabase,
    actorId,
    "match_created",
    POINT_VALUES.matchCreated,
    `match_created:${pair}`,
    { peerId: targetId },
  );
  await awardPoints(
    supabase,
    targetId,
    "match_created",
    POINT_VALUES.matchCreated,
    `match_created:${pair}`,
    { peerId: actorId },
  );

  return true;
}

async function reverseMatchPoints(
  supabase: Awaited<ReturnType<typeof createClient>>,
  aUserId: string,
  bUserId: string,
) {
  const pair = [aUserId, bUserId].sort().join(":");
  await spendPoints(
    supabase,
    aUserId,
    "match_reversed",
    POINT_VALUES.matchCreated,
    `match_reversed:${pair}:${aUserId}`,
    { peerId: bUserId },
  );
  await spendPoints(
    supabase,
    bUserId,
    "match_reversed",
    POINT_VALUES.matchCreated,
    `match_reversed:${pair}:${bUserId}`,
    { peerId: aUserId },
  );
}

export async function recordDiscoverAction(
  targetId: string,
  action: DiscoverAction,
): Promise<{ ok: boolean; matched?: boolean }> {
  if (!isSupabaseConfigured() || !isUuid(targetId)) {
    return { ok: true };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: true };
  }
  if (user.id === targetId) {
    return { ok: false };
  }

  const { data: beforeRow } = await supabase
    .from("discover_swipes")
    .select("action")
    .eq("viewer_id", user.id)
    .eq("target_id", targetId)
    .maybeSingle();
  const beforeAction = beforeRow?.action as string | undefined;
  const hadLikeBefore = beforeAction === "save" || beforeAction === "interested";
  if (action === "save" && !hadLikeBefore) {
    const limitReached = await hasReachedDailyLikeLimit(supabase, user.id);
    if (limitReached) return { ok: false };
  }

  const { data: reciprocalBefore } = await supabase
    .from("discover_swipes")
    .select("action")
    .eq("viewer_id", targetId)
    .eq("target_id", user.id)
    .in("action", ["save", "interested"])
    .maybeSingle();
  const wasMatchedBefore = hadLikeBefore && Boolean(reciprocalBefore);

  const { error } = await supabase.from("discover_swipes").upsert(
    {
      viewer_id: user.id,
      target_id: targetId,
      action,
    },
    { onConflict: "viewer_id,target_id" },
  );

  if (error) {
    console.error("recordDiscoverAction", error.message);
    return { ok: false };
  }

  await trackServerEvent({
    event: action === "save" ? "discover_saved_profile" : "discover_passed_profile",
    path: "/explore",
    metadata: { targetId },
  });

  if (action === "save" && !hadLikeBefore) {
    await awardPoints(
      supabase,
      user.id,
      "like_sent",
      POINT_VALUES.likeSent,
      `like_sent:${user.id}:${targetId}`,
      { targetId },
    );
  }

  if (action !== "save" && hadLikeBefore) {
    await spendPoints(
      supabase,
      user.id,
      "like_reversed",
      POINT_VALUES.likeSent,
      `like_reversed:${user.id}:${targetId}`,
      { targetId },
    );
    if (wasMatchedBefore) {
      await reverseMatchPoints(supabase, user.id, targetId);
    }
  }

  if (action !== "save") return { ok: true };

  try {
    const matched = await maybeNotifyForSave(supabase, user.id, targetId);
    return { ok: true, matched };
  } catch {
    return { ok: true };
  }
}

export async function setDiscoverAction(
  targetId: string,
  action: DiscoverAction,
  pathToRevalidate: string,
): Promise<{ ok: boolean }> {
  if (!isSupabaseConfigured() || !isUuid(targetId)) {
    return { ok: false };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || user.id === targetId) {
    return { ok: false };
  }

  const { data: beforeRow } = await supabase
    .from("discover_swipes")
    .select("action")
    .eq("viewer_id", user.id)
    .eq("target_id", targetId)
    .maybeSingle();
  const beforeAction = beforeRow?.action as string | undefined;
  const hadLikeBefore = beforeAction === "save" || beforeAction === "interested";
  if (action === "save" && !hadLikeBefore) {
    const limitReached = await hasReachedDailyLikeLimit(supabase, user.id);
    if (limitReached) return { ok: false };
  }
  const { data: reciprocalBefore } = await supabase
    .from("discover_swipes")
    .select("action")
    .eq("viewer_id", targetId)
    .eq("target_id", user.id)
    .in("action", ["save", "interested"])
    .maybeSingle();
  const wasMatchedBefore = hadLikeBefore && Boolean(reciprocalBefore);

  const { error } = await supabase.from("discover_swipes").upsert(
    {
      viewer_id: user.id,
      target_id: targetId,
      action,
    },
    { onConflict: "viewer_id,target_id" },
  );

  if (error) {
    console.error("setDiscoverAction", error.message);
    return { ok: false };
  }

  await trackServerEvent({
    event: action === "save" ? "likes_like_back" : "likes_pass",
    path: pathToRevalidate,
    metadata: { targetId },
  });

  if (action === "save" && !hadLikeBefore) {
    await awardPoints(
      supabase,
      user.id,
      "like_sent",
      POINT_VALUES.likeSent,
      `like_sent:${user.id}:${targetId}`,
      { targetId },
    );
    try {
      await maybeNotifyForSave(supabase, user.id, targetId);
    } catch {
      // Best-effort only.
    }
  }

  if (action !== "save" && hadLikeBefore) {
    await spendPoints(
      supabase,
      user.id,
      "like_reversed",
      POINT_VALUES.likeSent,
      `like_reversed:${user.id}:${targetId}`,
      { targetId },
    );
    if (wasMatchedBefore) {
      await reverseMatchPoints(supabase, user.id, targetId);
    }
  }

  if (action === "pass") {
    const { error: pipelineErr } = await supabase
      .from("interested_pipeline")
      .delete()
      .eq("viewer_id", user.id)
      .eq("target_id", targetId);
    if (pipelineErr) {
      /* optional table */
    }
    const { error: outreachErr } = await supabase
      .from("lead_outreach")
      .delete()
      .eq("viewer_id", user.id)
      .eq("target_id", targetId);
    if (outreachErr) {
      /* optional table */
    }
  }

  revalidatePath(pathToRevalidate);
  return { ok: true };
}

export async function removeDiscoverAction(
  targetId: string,
  pathToRevalidate: string,
): Promise<{ ok: boolean }> {
  if (!isSupabaseConfigured() || !isUuid(targetId)) {
    return { ok: false };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false };
  }

  const { data: beforeRow } = await supabase
    .from("discover_swipes")
    .select("action")
    .eq("viewer_id", user.id)
    .eq("target_id", targetId)
    .maybeSingle();
  const beforeAction = beforeRow?.action as string | undefined;
  const hadLikeBefore = beforeAction === "save" || beforeAction === "interested";
  const { data: reciprocalBefore } = await supabase
    .from("discover_swipes")
    .select("action")
    .eq("viewer_id", targetId)
    .eq("target_id", user.id)
    .in("action", ["save", "interested"])
    .maybeSingle();
  const wasMatchedBefore = hadLikeBefore && Boolean(reciprocalBefore);

  const { error } = await supabase
    .from("discover_swipes")
    .delete()
    .eq("viewer_id", user.id)
    .eq("target_id", targetId);

  if (error) {
    console.error("removeDiscoverAction", error.message);
    return { ok: false };
  }

  await trackServerEvent({
    event: "discover_remove_swipe",
    path: pathToRevalidate,
    metadata: { targetId },
  });

  if (hadLikeBefore) {
    await spendPoints(
      supabase,
      user.id,
      "like_reversed",
      POINT_VALUES.likeSent,
      `like_reversed:${user.id}:${targetId}`,
      { targetId },
    );
  }
  if (wasMatchedBefore) {
    await reverseMatchPoints(supabase, user.id, targetId);
  }

  const { error: pipelineErr } = await supabase
    .from("interested_pipeline")
    .delete()
    .eq("viewer_id", user.id)
    .eq("target_id", targetId);
  if (pipelineErr) {
    // Optional table in progressive rollouts.
  }

  const { error: outreachErr } = await supabase
    .from("lead_outreach")
    .delete()
    .eq("viewer_id", user.id)
    .eq("target_id", targetId);
  if (outreachErr) {
    // Optional table in progressive rollouts.
  }

  revalidatePath("/explore");
  revalidatePath(pathToRevalidate);
  return { ok: true };
}

export async function resetDiscoverSwipes(
  pathToRevalidate: string,
): Promise<{ ok: boolean }> {
  if (!isSupabaseConfigured()) {
    return { ok: false };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { ok: false };
  }

  // "Start over" should replay only profiles you previously dismissed ("pass").
  // Profiles in Saved / Interested are intentionally kept out of Discover
  // until the user explicitly removes them.
  const { error } = await supabase
    .from("discover_swipes")
    .delete()
    .eq("viewer_id", user.id)
    .eq("action", "pass");

  if (error) {
    console.error("resetDiscoverSwipes", error.message);
    return { ok: false };
  }

  revalidatePath(pathToRevalidate);
  return { ok: true };
}
