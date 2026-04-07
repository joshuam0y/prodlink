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
