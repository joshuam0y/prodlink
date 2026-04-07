"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail, isSupabaseConfigured } from "@/lib/env";

async function requireAdmin() {
  if (!isSupabaseConfigured()) redirect("/?error=supabase");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/moderation");
  if (!isAdminEmail(user.email)) redirect("/explore?notice=Admin%20access%20required");
  return { supabase, user };
}

export async function resolveReport(reportId: number, status: "open" | "resolved") {
  const { supabase, user } = await requireAdmin();
  const patch =
    status === "resolved"
      ? {
          status,
          resolved_at: new Date().toISOString(),
          resolved_by: user.id,
        }
      : {
          status,
          resolved_at: null,
          resolved_by: null,
        };
  const { error } = await supabase.from("match_message_reports").update(patch).eq("id", reportId);
  if (error) {
    redirect(`/admin/moderation?notice=${encodeURIComponent(`Could not update report #${reportId}.`)}`);
  }
  revalidatePath("/admin/moderation");
}

export async function unblockProfile(blockerId: string, blockedId: string) {
  const { supabase } = await requireAdmin();
  const { error } = await supabase
    .from("profile_blocks")
    .delete()
    .eq("blocker_id", blockerId)
    .eq("blocked_id", blockedId);
  if (error) {
    redirect("/admin/moderation?notice=Could%20not%20unblock%20that%20pair.");
  }
  revalidatePath("/admin/moderation");
}

export async function setProfileVerification(
  userId: string,
  mode: "unverified" | "partial" | "verified",
) {
  const { supabase } = await requireAdmin();
  const nowIso = new Date().toISOString();
  const patch =
    mode === "verified"
      ? {
          verification_status: "verified",
          id_verified_at: nowIso,
          linked_account_verified_at: nowIso,
        }
      : mode === "partial"
        ? {
            verification_status: "partial",
            id_verified_at: nowIso,
            linked_account_verified_at: null,
          }
        : {
            verification_status: "unverified",
            id_verified_at: null,
            linked_account_verified_at: null,
          };
  const { error } = await supabase.from("profiles").update(patch).eq("id", userId);
  if (error) {
    redirect("/admin/moderation?notice=Could%20not%20update%20verification%20status.");
  }
  revalidatePath("/admin/moderation");
  revalidatePath(`/p/${userId}`);
  revalidatePath("/explore");
}

export async function setReportEscalation(
  reportId: number,
  escalation: "none" | "watch" | "urgent",
) {
  const { supabase, user } = await requireAdmin();
  const { error } = await supabase
    .from("match_message_reports")
    .update({
      escalation_status: escalation,
      triaged_at: new Date().toISOString(),
      triaged_by: user.id,
    })
    .eq("id", reportId);
  if (error) {
    redirect(`/admin/moderation?notice=${encodeURIComponent(`Could not update escalation for report #${reportId}.`)}`);
  }
  revalidatePath("/admin/moderation");
}

export async function setReportModeratorNote(reportId: number, note: string) {
  const { supabase, user } = await requireAdmin();
  const trimmed = note.trim().slice(0, 1200);
  const { error } = await supabase
    .from("match_message_reports")
    .update({
      moderator_note: trimmed || null,
      triaged_at: new Date().toISOString(),
      triaged_by: user.id,
    })
    .eq("id", reportId);
  if (error) {
    redirect(`/admin/moderation?notice=${encodeURIComponent(`Could not save note for report #${reportId}.`)}`);
  }
  revalidatePath("/admin/moderation");
}

type BulkFilter = {
  priority?: "low" | "medium" | "high" | "";
  status?: "open" | "resolved" | "";
  escalation?: "none" | "watch" | "urgent" | "";
  reason?: string;
  owner?: "me" | "";
};

export async function bulkModerateReports(
  operation: "resolve" | "reopen" | "watch" | "urgent" | "clear_escalation",
  filters: BulkFilter,
  confirmationText: string,
) {
  if (confirmationText.trim().toUpperCase() !== "BULK") {
    redirect("/admin/moderation?notice=Type%20BULK%20to%20confirm%20a%20bulk%20action.");
  }
  const { supabase, user } = await requireAdmin();
  let query = supabase
    .from("match_message_reports")
    .select("id")
    .order("created_at", { ascending: false })
    .limit(200);
  if (filters.priority) query = query.eq("ai_priority", filters.priority);
  if (filters.status) query = query.eq("status", filters.status);
  if (filters.escalation) query = query.eq("escalation_status", filters.escalation);
  if (filters.owner === "me") query = query.eq("triaged_by", user.id);
  if (filters.reason?.trim()) query = query.ilike("reason", `%${filters.reason.trim().replace(/[%_]/g, "")}%`);
  const { data: rows, error: selectError } = await query;
  if (selectError) {
    redirect("/admin/moderation?notice=Could%20not%20load%20filtered%20reports.");
  }
  const reportIds = ((rows as Array<{ id: number }> | null) ?? []).map((r) => r.id);
  if (reportIds.length === 0) {
    redirect("/admin/moderation?notice=No%20reports%20matched%20that%20bulk%20action.");
  }

  const nowIso = new Date().toISOString();
  const patch =
    operation === "resolve"
      ? { status: "resolved", resolved_at: nowIso, resolved_by: user.id }
      : operation === "reopen"
        ? { status: "open", resolved_at: null, resolved_by: null }
        : operation === "watch"
          ? { escalation_status: "watch", triaged_at: nowIso, triaged_by: user.id }
          : operation === "urgent"
            ? { escalation_status: "urgent", triaged_at: nowIso, triaged_by: user.id }
            : { escalation_status: "none", triaged_at: nowIso, triaged_by: user.id };

  const { error } = await supabase.from("match_message_reports").update(patch).in("id", reportIds);
  if (error) {
    redirect("/admin/moderation?notice=Bulk%20action%20failed.");
  }
  revalidatePath("/admin/moderation");
}
