import type { SupabaseClient } from "@supabase/supabase-js";

export const POINT_VALUES = {
  onboardingComplete: 25,
  likeSent: 2,
  matchCreated: 10,
  messageSent: 1,
} as const;

type JsonValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: JsonValue }
  | JsonValue[];

export async function awardPoints(
  supabase: SupabaseClient,
  userId: string,
  eventName: string,
  points: number,
  eventKey: string,
  metadata: Record<string, JsonValue> = {},
): Promise<boolean> {
  if (!userId || points <= 0 || !eventKey) return false;
  const { data, error } = await supabase.rpc("award_points", {
    p_user_id: userId,
    p_event_name: eventName,
    p_points: points,
    p_event_key: eventKey,
    p_metadata: metadata,
  });
  if (error) return false;
  const row = Array.isArray(data) ? data[0] : data;
  return Boolean(row?.applied);
}

export async function getPointsBalance(
  supabase: SupabaseClient,
  userId: string,
): Promise<number> {
  if (!userId) return 0;
  const { data } = await supabase
    .from("user_points_balance")
    .select("balance")
    .eq("user_id", userId)
    .maybeSingle();
  return Number(data?.balance ?? 0);
}

export async function spendPoints(
  supabase: SupabaseClient,
  userId: string,
  eventName: string,
  points: number,
  eventKey: string,
  metadata: Record<string, JsonValue> = {},
): Promise<boolean> {
  if (!userId || points <= 0 || !eventKey) return false;
  const { data, error } = await supabase.rpc("spend_points", {
    p_user_id: userId,
    p_event_name: eventName,
    p_points: points,
    p_event_key: eventKey,
    p_metadata: metadata,
  });
  if (error) return false;
  const row = Array.isArray(data) ? data[0] : data;
  return Boolean(row?.applied);
}

export async function resetPoints(
  supabase: SupabaseClient,
  userId: string,
  reason = "manual_reset",
): Promise<{ applied: boolean; pointsBalance: number }> {
  if (!userId) return { applied: false, pointsBalance: 0 };
  const eventKey = `points_reset:${userId}:${new Date().toISOString()}`;
  const { data, error } = await supabase.rpc("reset_points", {
    p_user_id: userId,
    p_reason: reason,
    p_event_key: eventKey,
    p_metadata: { source: "points_page" },
  });
  if (error) return { applied: false, pointsBalance: 0 };
  const row = Array.isArray(data) ? data[0] : data;
  return {
    applied: Boolean(row?.applied),
    pointsBalance: Number(row?.new_points_balance ?? 0),
  };
}
