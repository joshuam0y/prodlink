"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  OUTREACH_REDEEM_OPTIONS,
  redeemPointsForOutreachCredits,
  resetOutreachCredits,
} from "@/lib/outreach-credits";
import { isSupabaseConfigured } from "@/lib/env";

export async function redeemOutreachCreditsAction(formData: FormData) {
  if (!isSupabaseConfigured()) redirect("/points?notice=Supabase%20is%20not%20configured.");
  const optionValue = String(formData.get("option") ?? "");
  const selected = OUTREACH_REDEEM_OPTIONS.find(
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

  const eventKey = `redeem_outreach_credit:${user.id}:${optionValue}:${new Date().toISOString()}`;
  const result = await redeemPointsForOutreachCredits(
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

export async function resetAllOutreachCreditsAction() {
  if (!isSupabaseConfigured()) redirect("/points?notice=Supabase%20is%20not%20configured.");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/points");

  const result = await resetOutreachCredits(supabase, user.id);

  revalidatePath("/points");
  revalidatePath("/explore");
  revalidatePath("/matches");
  revalidatePath("/");
  if (result.applied) {
    redirect("/points?notice=Outreach%20credits%20reset%20to%20zero.");
  }
  redirect("/points?notice=Outreach%20credits%20were%20already%20at%20zero.");
}
