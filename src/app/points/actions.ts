"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  SWIPE_CREDIT_REDEEM_OPTIONS,
  redeemPointsForSwipeCredits,
  resetSwipeCredits,
} from "@/lib/outreach-credits";
import { resetPoints } from "@/lib/points";
import { isSupabaseConfigured } from "@/lib/env";

export async function redeemSwipeCreditsAction(formData: FormData) {
  if (!isSupabaseConfigured()) redirect("/points?notice=Supabase%20is%20not%20configured.");
  const optionValue = String(formData.get("option") ?? "");
  const selected = SWIPE_CREDIT_REDEEM_OPTIONS.find(
    (opt) => `${opt.points}:${opt.credits}` === optionValue,
  );
  if (!selected) {
    redirect("/points?notice=Invalid%20redeem%20option.");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/points");

  const eventKey = `redeem_swipe_credit:${user.id}:${optionValue}:${new Date().toISOString()}`;
  const result = await redeemPointsForSwipeCredits(
    supabase,
    user.id,
    selected.points,
    selected.credits,
    eventKey,
    { source: "points_page", maxPerDay: selected.maxPerDay },
  );

  if (!result.applied) {
    redirect("/points?notice=Redeem%20did%20not%20apply.%20You%20may%20be%20out%20of%20points%20or%20at%20today%27s%20limit.");
  }

  revalidatePath("/points");
  revalidatePath("/explore");
  revalidatePath("/matches");
  revalidatePath("/");
}

export async function resetAllSwipeCreditsAction() {
  if (!isSupabaseConfigured()) redirect("/points?notice=Supabase%20is%20not%20configured.");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/points");

  const result = await resetSwipeCredits(supabase, user.id);

  revalidatePath("/points");
  revalidatePath("/explore");
  revalidatePath("/matches");
  revalidatePath("/");
  if (result.applied) {
    redirect("/points?notice=Swipe%20credits%20reset%20to%20zero.");
  }
  redirect("/points?notice=Swipe%20credits%20were%20already%20at%20zero.");
}

export async function resetAllPointsAction() {
  if (!isSupabaseConfigured()) redirect("/points?notice=Supabase%20is%20not%20configured.");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/points");

  const result = await resetPoints(supabase, user.id);

  revalidatePath("/points");
  revalidatePath("/explore");
  revalidatePath("/matches");
  revalidatePath("/");
  if (result.applied) {
    redirect("/points?notice=Points%20balance%20reset%20to%20zero.");
  }
  redirect("/points?notice=Points%20balance%20was%20already%20zero.");
}
