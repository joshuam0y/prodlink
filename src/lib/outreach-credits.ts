import type { SupabaseClient } from "@supabase/supabase-js";

type JsonValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: JsonValue }
  | JsonValue[];

export const OUTREACH_REDEEM_OPTIONS = [
  { points: 50, credits: 1, maxPerDay: 5 },
  { points: 120, credits: 3, maxPerDay: 3 },
  { points: 350, credits: 10, maxPerDay: 1 },
] as const;

export async function getOutreachCreditsBalance(
  supabase: SupabaseClient,
  userId: string,
): Promise<number> {
  if (!userId) return 0;
  const { data } = await supabase
    .from("user_outreach_credits_balance")
    .select("balance")
    .eq("user_id", userId)
    .maybeSingle();
  return Number(data?.balance ?? 0);
}

export async function redeemPointsForOutreachCredits(
  supabase: SupabaseClient,
  userId: string,
  pointsToSpend: number,
  creditsToGrant: number,
  eventKey: string,
  metadata: Record<string, JsonValue> = {},
): Promise<{ applied: boolean; pointsBalance: number; creditsBalance: number }> {
  if (!userId || pointsToSpend <= 0 || creditsToGrant <= 0 || !eventKey) {
    return { applied: false, pointsBalance: 0, creditsBalance: 0 };
  }
  const { data, error } = await supabase.rpc("redeem_points_for_outreach_credits", {
    p_user_id: userId,
    p_points_to_spend: pointsToSpend,
    p_credits_to_grant: creditsToGrant,
    p_event_key: eventKey,
    p_metadata: metadata,
    p_max_per_day:
      metadata && typeof metadata.maxPerDay === "number" ? Number(metadata.maxPerDay) : null,
  });
  if (error) return { applied: false, pointsBalance: 0, creditsBalance: 0 };
  const row = Array.isArray(data) ? data[0] : data;
  return {
    applied: Boolean(row?.applied),
    pointsBalance: Number(row?.new_points_balance ?? 0),
    creditsBalance: Number(row?.new_credit_balance ?? 0),
  };
}

export async function spendOutreachCredits(
  supabase: SupabaseClient,
  userId: string,
  credits: number,
  eventName: string,
  eventKey: string,
  metadata: Record<string, JsonValue> = {},
): Promise<{ applied: boolean; creditsBalance: number }> {
  if (!userId || credits <= 0 || !eventKey) {
    return { applied: false, creditsBalance: 0 };
  }
  const { data, error } = await supabase.rpc("spend_outreach_credits", {
    p_user_id: userId,
    p_credits: credits,
    p_event_name: eventName,
    p_event_key: eventKey,
    p_metadata: metadata,
  });
  if (error) return { applied: false, creditsBalance: 0 };
  const row = Array.isArray(data) ? data[0] : data;
  return {
    applied: Boolean(row?.applied),
    creditsBalance: Number(row?.new_credit_balance ?? 0),
  };
}

export async function resetOutreachCredits(
  supabase: SupabaseClient,
  userId: string,
  reason = "manual_reset",
): Promise<{ applied: boolean; creditsBalance: number }> {
  if (!userId) return { applied: false, creditsBalance: 0 };
  const eventKey = `outreach_credit_reset:${userId}:${new Date().toISOString()}`;
  const { data, error } = await supabase.rpc("reset_outreach_credits", {
    p_user_id: userId,
    p_reason: reason,
    p_event_key: eventKey,
    p_metadata: { source: "points_page" },
  });
  if (error) return { applied: false, creditsBalance: 0 };
  const row = Array.isArray(data) ? data[0] : data;
  return {
    applied: Boolean(row?.applied),
    creditsBalance: Number(row?.new_credit_balance ?? 0),
  };
}
