"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { OUTREACH_REDEEM_OPTIONS, redeemPointsForOutreachCredits } from "@/lib/outreach-credits";
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
    { source: "points_page" },
  );

  if (!result.applied) {
    redirect("/points?notice=Not%20enough%20points%20to%20redeem%20that%20option.");
  }

  revalidatePath("/points");
  revalidatePath("/explore");
  revalidatePath("/matches");
  revalidatePath("/");
}
