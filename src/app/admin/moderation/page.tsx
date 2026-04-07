import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdminEmail, isSupabaseConfigured } from "@/lib/env";
import {
  resolveReport,
  setProfileVerification,
  bulkModerateReports,
  setReportEscalation,
  setReportModeratorNote,
  unblockProfile,
} from "./actions";

type ReportRow = {
  id: number;
  reporter_id: string;
  reported_user_id: string;
  message_id: number | null;
  reason: string;
  details: string | null;
  ai_summary?: string | null;
  ai_priority?: "low" | "medium" | "high" | null;
  ai_labels?: unknown;
  status: "open" | "resolved";
  escalation_status?: "none" | "watch" | "urgent" | null;
  moderator_note?: string | null;
  triaged_at?: string | null;
  triaged_by?: string | null;
  created_at: string;
};

type BlockRow = {
  blocker_id: string;
  blocked_id: string;
  reason: string | null;
  created_at: string;
};

export default async function ModerationAdminPage({
  searchParams,
}: {
  searchParams: Promise<{
    notice?: string;
    q?: string;
    priority?: string;
    status?: string;
    reason?: string;
    escalation?: string;
    owner?: string;
    stale?: string;
    sort?: string;
  }>;
}) {
  if (!isSupabaseConfigured()) redirect("/?error=supabase");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/moderation");
  if (!isAdminEmail(user.email)) redirect("/explore?notice=Admin%20access%20required");

  const params = await searchParams;
  const notice = params.notice ? decodeURIComponent(params.notice) : null;
  const query = (params.q ? decodeURIComponent(params.q) : "").trim();
  const priorityFilter =
    params.priority === "high" || params.priority === "medium" || params.priority === "low"
      ? params.priority
      : "";
  const statusFilter = params.status === "open" || params.status === "resolved" ? params.status : "";
  const reasonFilter = (params.reason ? decodeURIComponent(params.reason) : "").trim().toLowerCase();
  const escalationFilter =
    params.escalation === "none" || params.escalation === "watch" || params.escalation === "urgent"
      ? params.escalation
      : "";
  const ownerFilter = params.owner === "me" ? "me" : "";
  const staleFilter = params.stale === "24h" || params.stale === "72h" ? params.stale : "";
  const sortFilter = params.sort === "oldest" ? "oldest" : "";

  const { data: reports } = await supabase
    .from("match_message_reports")
    .select(
      "id, reporter_id, reported_user_id, message_id, reason, details, ai_summary, ai_priority, ai_labels, status, escalation_status, moderator_note, triaged_at, triaged_by, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(200);

  const { data: blocks } = await supabase
    .from("profile_blocks")
    .select("blocker_id, blocked_id, reason, created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  const { count: signupsCount } = await supabase
    .from("product_events")
    .select("id", { count: "exact", head: true })
    .eq("event_name", "sign_up_succeeded");
  const { count: onboardingCount } = await supabase
    .from("product_events")
    .select("id", { count: "exact", head: true })
    .eq("event_name", "onboarding_completed");
  const { count: matchCount } = await supabase
    .from("product_events")
    .select("id", { count: "exact", head: true })
    .eq("event_name", "match_created");
  const { count: messageCount } = await supabase
    .from("product_events")
    .select("id", { count: "exact", head: true })
    .eq("event_name", "message_sent");
  const { data: recentEvents } = await supabase
    .from("product_events")
    .select("id, event_name, user_id, path, created_at")
    .order("created_at", { ascending: false })
    .limit(12);

  const userLookup = query
    ? await supabase
        .from("profiles")
        .select("id, display_name, role, city, looking_for, updated_at, verification_status, id_verified_at, linked_account_verified_at")
        .or(`id.eq.${query},display_name.ilike.%${query.replace(/[%_,]/g, "")}%`)
        .order("updated_at", { ascending: false })
        .limit(20)
    : { data: [] };
  const buildFilterHref = (overrides: {
    priority?: string;
    status?: string;
    reason?: string;
    escalation?: string;
    owner?: string;
    stale?: string;
    sort?: string;
  }) => {
    const nextPriority = overrides.priority ?? priorityFilter;
    const nextStatus = overrides.status ?? statusFilter;
    const nextReason = overrides.reason ?? reasonFilter;
    const nextEscalation = overrides.escalation ?? escalationFilter;
    const nextOwner = overrides.owner ?? ownerFilter;
    const nextStale = overrides.stale ?? staleFilter;
    const nextSort = overrides.sort ?? sortFilter;
    const usp = new URLSearchParams();
    if (query) usp.set("q", query);
    if (nextPriority) usp.set("priority", nextPriority);
    if (nextStatus) usp.set("status", nextStatus);
    if (nextReason) usp.set("reason", nextReason);
    if (nextEscalation) usp.set("escalation", nextEscalation);
    if (nextOwner) usp.set("owner", nextOwner);
    if (nextStale) usp.set("stale", nextStale);
    if (nextSort) usp.set("sort", nextSort);
    const qs = usp.toString();
    return qs ? `/admin/moderation?${qs}` : "/admin/moderation";
  };
  const runbooks = [
    {
      label: "High + open",
      href: buildFilterHref({
        priority: "high",
        status: "open",
        escalation: "",
        owner: "",
      }),
    },
    {
      label: "Urgent queue",
      href: buildFilterHref({
        escalation: "urgent",
        status: "open",
      }),
    },
    {
      label: "My queue",
      href: buildFilterHref({
        owner: "me",
        status: "open",
      }),
    },
    {
      label: "Needs triage",
      href: buildFilterHref({
        owner: "",
        escalation: "none",
        status: "open",
      }),
    },
    {
      label: "Stale 24h+",
      href: buildFilterHref({
        stale: "24h",
        status: "open",
      }),
    },
    {
      label: "Stale 72h+",
      href: buildFilterHref({
        stale: "72h",
        status: "open",
      }),
    },
    {
      label: "Reset filters",
      href: "/admin/moderation",
    },
  ];

  const filteredReports = (((reports as ReportRow[] | null) ?? []).filter((r) => {
    if (priorityFilter && r.ai_priority !== priorityFilter) return false;
    if (statusFilter && r.status !== statusFilter) return false;
    if (escalationFilter && (r.escalation_status ?? "none") !== escalationFilter) return false;
    if (reasonFilter && !r.reason.toLowerCase().includes(reasonFilter)) return false;
    if (ownerFilter === "me" && r.triaged_by !== user.id) return false;
    if (staleFilter) {
      const createdMs = new Date(r.created_at).getTime();
      if (!Number.isFinite(createdMs)) return false;
      const ageHours = (Date.now() - createdMs) / (1000 * 60 * 60);
      if (staleFilter === "24h" && ageHours < 24) return false;
      if (staleFilter === "72h" && ageHours < 72) return false;
    }
    return true;
  }));
  const triagedByIds = Array.from(
    new Set(
      (((reports as ReportRow[] | null) ?? [])
        .map((r) => r.triaged_by)
        .filter((id): id is string => Boolean(id))),
    ),
  );
  const triageNamesLookup =
    triagedByIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, display_name")
          .in("id", triagedByIds)
      : { data: [] };
  const triageNames = new Map(
    (((triageNamesLookup.data as Array<{ id: string; display_name: string | null }> | null) ?? []).map((p) => [
      p.id,
      p.display_name?.trim() || "Admin",
    ])),
  );
  const sortedReports = [...filteredReports].sort((a, b) => {
    if (sortFilter === "oldest") {
      return a.created_at.localeCompare(b.created_at);
    }
    if (staleFilter) {
      const ageHours = (row: ReportRow) =>
        (Date.now() - new Date(row.created_at).getTime()) / (1000 * 60 * 60);
      return ageHours(b) - ageHours(a);
    }
    const statusScore = (value: ReportRow["status"]) => (value === "open" ? 1 : 0);
    const priorityScore = (value: ReportRow["ai_priority"]) =>
      value === "high" ? 3 : value === "medium" ? 2 : value === "low" ? 1 : 0;
    const byStatus = statusScore(b.status) - statusScore(a.status);
    if (byStatus !== 0) return byStatus;
    const byPriority = priorityScore(b.ai_priority) - priorityScore(a.ai_priority);
    if (byPriority !== 0) return byPriority;
    return b.created_at.localeCompare(a.created_at);
  });
  const openCount = (((reports as ReportRow[] | null) ?? []).filter((r) => r.status === "open")).length;
  const blockRows = (blocks as BlockRow[] | null) ?? [];
  const blockKey = (a: string, b: string) => `${a}:${b}`;
  const activeBlocks = new Set(blockRows.map((b) => blockKey(b.blocker_id, b.blocked_id)));

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
      <h1 className="text-2xl font-semibold text-zinc-50">Moderation</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Review reports, resolve cases, and manage blocks. Open reports: {openCount} · Active blocks:{" "}
        {blockRows.length}
      </p>
      {notice ? (
        <p className="mt-3 rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-2 text-sm text-amber-100">
          {notice}
        </p>
      ) : null}

      <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Signups", value: signupsCount ?? 0 },
          { label: "Onboarded", value: onboardingCount ?? 0 },
          { label: "Matches", value: matchCount ?? 0 },
          { label: "Messages sent", value: messageCount ?? 0 },
        ].map((metric) => (
          <div key={metric.label} className="rounded-xl border border-white/10 bg-zinc-900/40 p-4">
            <p className="text-xs uppercase tracking-wider text-zinc-500">{metric.label}</p>
            <p className="mt-2 text-2xl font-semibold text-zinc-100">{metric.value}</p>
          </div>
        ))}
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Internal profile lookup</h2>
          <form className="mt-3 flex gap-2" action="/admin/moderation">
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Search by profile ID or display name"
              className="flex-1 rounded-xl border border-white/10 bg-zinc-950/50 px-4 py-2.5 text-sm text-zinc-200 placeholder:text-zinc-600"
            />
            <button
              type="submit"
              className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-zinc-950"
            >
              Search
            </button>
          </form>
          <p className="mt-2 text-xs text-zinc-500">
            Admin-only lookup. Users still cannot search for each other anywhere in the product.
          </p>
          <ul className="mt-4 space-y-2">
            {(((userLookup.data as Array<{
              id: string;
              display_name: string | null;
              role: string | null;
              city: string | null;
              looking_for: string | null;
              updated_at: string | null;
              verification_status?: "unverified" | "partial" | "verified" | null;
              id_verified_at?: string | null;
              linked_account_verified_at?: string | null;
            }> | null) ?? [])).length === 0 ? (
              <li className="rounded-xl border border-white/10 bg-zinc-950/30 px-4 py-3 text-sm text-zinc-500">
                {query ? "No matching profiles found." : "Search a profile by ID or display name."}
              </li>
            ) : (
              (((userLookup.data as Array<{
                id: string;
                display_name: string | null;
                role: string | null;
                city: string | null;
                looking_for: string | null;
                updated_at: string | null;
                verification_status?: "unverified" | "partial" | "verified" | null;
                id_verified_at?: string | null;
                linked_account_verified_at?: string | null;
              }> | null) ?? [])).map((p) => (
                <li key={p.id} className="rounded-xl border border-white/10 bg-zinc-950/30 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1 text-sm text-zinc-300">
                      <p className="font-medium text-zinc-100">{p.display_name?.trim() || "Member"}</p>
                      <p className="text-zinc-500">{p.id}</p>
                      <p className="text-zinc-500">
                        {[p.role, p.city].filter(Boolean).join(" · ")}
                      </p>
                      {p.looking_for?.trim() ? (
                        <p className="text-zinc-400">Looking for: {p.looking_for.trim()}</p>
                      ) : null}
                      <p className="text-zinc-400">
                        Verification: {p.verification_status ?? "unverified"}
                        {p.id_verified_at ? " · ID" : ""}
                        {p.linked_account_verified_at ? " · Linked" : ""}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Link
                        href={`/p/${p.id}`}
                        className="rounded-full border border-white/15 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:bg-white/5"
                      >
                        Public profile
                      </Link>
                      <form
                        action={async () => {
                          "use server";
                          await setProfileVerification(p.id, "partial");
                        }}
                      >
                        <button
                          type="submit"
                          className="rounded-full border border-sky-500/35 px-3 py-1.5 text-xs font-medium text-sky-200 hover:bg-sky-500/10"
                        >
                          Set partial
                        </button>
                      </form>
                      <form
                        action={async () => {
                          "use server";
                          await setProfileVerification(p.id, "verified");
                        }}
                      >
                        <button
                          type="submit"
                          className="rounded-full border border-emerald-500/35 px-3 py-1.5 text-xs font-medium text-emerald-200 hover:bg-emerald-500/10"
                        >
                          Set verified
                        </button>
                      </form>
                      <form
                        action={async () => {
                          "use server";
                          await setProfileVerification(p.id, "unverified");
                        }}
                      >
                        <button
                          type="submit"
                          className="rounded-full border border-zinc-500/35 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-500/10"
                        >
                          Clear
                        </button>
                      </form>
                    </div>
                  </div>
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="rounded-2xl border border-white/10 bg-zinc-900/40 p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Recent product events</h2>
          <ul className="mt-3 space-y-2">
            {((recentEvents as Array<{
              id: number;
              event_name: string;
              user_id: string | null;
              path: string | null;
              created_at: string;
            }> | null) ?? []).map((e) => (
              <li key={e.id} className="rounded-xl border border-white/10 bg-zinc-950/30 px-3 py-2">
                <p className="text-sm font-medium text-zinc-100">{e.event_name}</p>
                <p className="mt-1 text-xs text-zinc-500">
                  {e.path ?? "no-path"} · {e.user_id ?? "anon"} ·{" "}
                  {new Date(e.created_at).toLocaleString()}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mt-8">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-zinc-500">Runbooks</p>
          {runbooks.map((runbook) => (
            <Link
              key={runbook.label}
              href={runbook.href}
              className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-zinc-200 hover:bg-white/10"
            >
              {runbook.label}
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Reports</h2>
          <div className="flex flex-wrap gap-2">
            <p className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-zinc-300">
              Filtered reports: {sortedReports.length}
            </p>
            <form
              action={async (fd) => {
                "use server";
                await bulkModerateReports("resolve", {
                  priority: priorityFilter as "low" | "medium" | "high" | "",
                  status: statusFilter as "open" | "resolved" | "",
                  escalation: escalationFilter as "none" | "watch" | "urgent" | "",
                  reason: reasonFilter,
                  owner: ownerFilter as "me" | "",
                }, String(fd.get("confirm") ?? ""));
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                name="confirm"
                placeholder="Type BULK"
                className="w-24 rounded-full border border-white/10 bg-zinc-950/50 px-3 py-1 text-xs text-zinc-200 placeholder:text-zinc-600"
              />
              <button
                type="submit"
                className="rounded-full border border-emerald-500/35 px-3 py-1 text-xs font-medium text-emerald-200 hover:bg-emerald-500/10"
              >
                Bulk resolve filtered
              </button>
            </form>
            <form
              action={async (fd) => {
                "use server";
                await bulkModerateReports("urgent", {
                  priority: priorityFilter as "low" | "medium" | "high" | "",
                  status: statusFilter as "open" | "resolved" | "",
                  escalation: escalationFilter as "none" | "watch" | "urgent" | "",
                  reason: reasonFilter,
                  owner: ownerFilter as "me" | "",
                }, String(fd.get("confirm") ?? ""));
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                name="confirm"
                placeholder="Type BULK"
                className="w-24 rounded-full border border-white/10 bg-zinc-950/50 px-3 py-1 text-xs text-zinc-200 placeholder:text-zinc-600"
              />
              <button
                type="submit"
                className="rounded-full border border-red-500/35 px-3 py-1 text-xs font-medium text-red-200 hover:bg-red-500/10"
              >
                Bulk mark urgent
              </button>
            </form>
            <form
              action={async (fd) => {
                "use server";
                await bulkModerateReports("clear_escalation", {
                  priority: priorityFilter as "low" | "medium" | "high" | "",
                  status: statusFilter as "open" | "resolved" | "",
                  escalation: escalationFilter as "none" | "watch" | "urgent" | "",
                  reason: reasonFilter,
                  owner: ownerFilter as "me" | "",
                }, String(fd.get("confirm") ?? ""));
              }}
              className="flex items-center gap-2"
            >
              <input
                type="text"
                name="confirm"
                placeholder="Type BULK"
                className="w-24 rounded-full border border-white/10 bg-zinc-950/50 px-3 py-1 text-xs text-zinc-200 placeholder:text-zinc-600"
              />
              <button
                type="submit"
                className="rounded-full border border-zinc-500/35 px-3 py-1 text-xs font-medium text-zinc-300 hover:bg-zinc-500/10"
              >
                Bulk clear escalation
              </button>
            </form>
            {[
              { label: "Newest first", value: "" },
              { label: "Oldest first", value: "oldest" },
            ].map((option) => (
              <Link
                key={option.label}
                href={buildFilterHref({ sort: option.value })}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  sortFilter === option.value
                    ? "bg-teal-500/20 text-teal-100 ring-1 ring-teal-500/35"
                    : "bg-white/5 text-zinc-400 ring-1 ring-white/10 hover:bg-white/10 hover:text-zinc-200"
                }`}
              >
                {option.label}
              </Link>
            ))}
            {[
              { label: "Age: all", value: "" },
              { label: "Age: 24h+", value: "24h" },
              { label: "Age: 72h+", value: "72h" },
            ].map((option) => (
              <Link
                key={option.label}
                href={buildFilterHref({ stale: option.value })}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  staleFilter === option.value
                    ? "bg-fuchsia-500/20 text-fuchsia-100 ring-1 ring-fuchsia-500/35"
                    : "bg-white/5 text-zinc-400 ring-1 ring-white/10 hover:bg-white/10 hover:text-zinc-200"
                }`}
              >
                {option.label}
              </Link>
            ))}
            {[
              { label: "Owner: all", value: "" },
              { label: "Owner: me", value: "me" },
            ].map((option) => (
              <Link
                key={option.label}
                href={buildFilterHref({ owner: option.value })}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  ownerFilter === option.value
                    ? "bg-indigo-500/20 text-indigo-100 ring-1 ring-indigo-500/35"
                    : "bg-white/5 text-zinc-400 ring-1 ring-white/10 hover:bg-white/10 hover:text-zinc-200"
                }`}
              >
                {option.label}
              </Link>
            ))}
            {[
              { label: "Status: all", value: "" },
              { label: "Status: open", value: "open" },
              { label: "Status: resolved", value: "resolved" },
            ].map((option) => (
              <Link
                key={option.label}
                href={buildFilterHref({ status: option.value })}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  statusFilter === option.value
                    ? "bg-sky-500/20 text-sky-100 ring-1 ring-sky-500/35"
                    : "bg-white/5 text-zinc-400 ring-1 ring-white/10 hover:bg-white/10 hover:text-zinc-200"
                }`}
              >
                {option.label}
              </Link>
            ))}
            {[
              { label: "All", value: "" },
              { label: "High", value: "high" },
              { label: "Medium", value: "medium" },
              { label: "Low", value: "low" },
            ].map((option) => (
              <Link
                key={option.label}
                href={buildFilterHref({ priority: option.value })}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  priorityFilter === option.value
                    ? "bg-amber-500/20 text-amber-200 ring-1 ring-amber-500/35"
                    : "bg-white/5 text-zinc-400 ring-1 ring-white/10 hover:bg-white/10 hover:text-zinc-200"
                }`}
              >
                {option.label}
              </Link>
            ))}
            {[
              { label: "Esc: all", value: "" },
              { label: "Esc: none", value: "none" },
              { label: "Esc: watch", value: "watch" },
              { label: "Esc: urgent", value: "urgent" },
            ].map((option) => (
              <Link
                key={option.label}
                href={buildFilterHref({ escalation: option.value })}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  escalationFilter === option.value
                    ? "bg-red-500/20 text-red-100 ring-1 ring-red-500/35"
                    : "bg-white/5 text-zinc-400 ring-1 ring-white/10 hover:bg-white/10 hover:text-zinc-200"
                }`}
              >
                {option.label}
              </Link>
            ))}
            <form action="/admin/moderation" className="flex items-center gap-2">
              {query ? <input type="hidden" name="q" value={query} /> : null}
              {priorityFilter ? <input type="hidden" name="priority" value={priorityFilter} /> : null}
              {statusFilter ? <input type="hidden" name="status" value={statusFilter} /> : null}
              {escalationFilter ? <input type="hidden" name="escalation" value={escalationFilter} /> : null}
              {ownerFilter ? <input type="hidden" name="owner" value={ownerFilter} /> : null}
              {staleFilter ? <input type="hidden" name="stale" value={staleFilter} /> : null}
              {sortFilter ? <input type="hidden" name="sort" value={sortFilter} /> : null}
              <input
                type="text"
                name="reason"
                defaultValue={reasonFilter}
                placeholder="Filter reason text"
                className="w-40 rounded-full border border-white/10 bg-zinc-950/50 px-3 py-1 text-xs text-zinc-200 placeholder:text-zinc-600"
              />
              <button
                type="submit"
                className="rounded-full border border-white/15 px-3 py-1 text-xs font-medium text-zinc-200 hover:bg-white/5"
              >
                Apply
              </button>
            </form>
          </div>
        </div>
        <ul className="mt-3 space-y-2">
          {sortedReports.length === 0 ? (
            <li className="rounded-xl border border-white/10 bg-zinc-900/40 px-4 py-3 text-sm text-zinc-500">
              {priorityFilter ? `No ${priorityFilter} priority reports right now.` : "No reports yet."}
            </li>
          ) : (
            sortedReports.map((r) => (
              <li key={r.id} className="rounded-xl border border-white/10 bg-zinc-900/40 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1 text-sm text-zinc-300">
                    {(() => {
                      const ageHours = Math.floor(
                        (Date.now() - new Date(r.created_at).getTime()) / (1000 * 60 * 60),
                      );
                      const ageClass =
                        ageHours >= 72
                          ? "border-red-500/35 bg-red-500/10 text-red-200"
                          : ageHours >= 24
                            ? "border-amber-500/35 bg-amber-500/10 text-amber-200"
                            : "border-white/15 bg-white/5 text-zinc-300";
                      return (
                        <p className="mb-1">
                          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${ageClass}`}>
                            {ageHours >= 1 ? `${ageHours}h old` : "<1h old"}
                          </span>
                        </p>
                      );
                    })()}
                    <p>
                      <span className="text-zinc-500">Report</span> #{r.id} ·{" "}
                      <span className={r.status === "open" ? "text-amber-300" : "text-emerald-300"}>
                        {r.status}
                      </span>
                    </p>
                    <p className="text-zinc-400">Reason: {r.reason}</p>
                    <p className="text-zinc-500">
                      Escalation:{" "}
                      <span className="text-zinc-300">{r.escalation_status ?? "none"}</span>
                    </p>
                    {r.triaged_by ? (
                      <p className="text-zinc-500">
                        Triaged by: {triageNames.get(r.triaged_by) ?? "Admin"} ·{" "}
                        {r.triaged_at ? new Date(r.triaged_at).toLocaleString() : "time unknown"}
                      </p>
                    ) : null}
                    <p className="text-zinc-500">Reporter: {r.reporter_id}</p>
                    <p className="text-zinc-500">Reported: {r.reported_user_id}</p>
                    {r.message_id ? <p className="text-zinc-500">Message ID: {r.message_id}</p> : null}
                    {r.details ? <p className="text-zinc-400">Details: {r.details}</p> : null}
                    {r.ai_summary?.trim() ? (
                      <div className="mt-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5 px-3 py-2">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-emerald-300/90">
                          AI triage
                        </p>
                        <p className="mt-1 text-zinc-300">{r.ai_summary.trim()}</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {r.ai_priority ? (
                            <span
                              className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                                r.ai_priority === "high"
                                  ? "bg-red-500/15 text-red-200 ring-1 ring-red-500/35"
                                  : r.ai_priority === "medium"
                                    ? "bg-amber-500/15 text-amber-200 ring-1 ring-amber-500/35"
                                    : "bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-500/35"
                              }`}
                            >
                              {r.ai_priority} priority
                            </span>
                          ) : null}
                          {Array.isArray(r.ai_labels)
                            ? r.ai_labels
                                .filter((label): label is string => typeof label === "string" && label.trim().length > 0)
                                .slice(0, 5)
                                .map((label) => (
                                  <span
                                    key={`${r.id}-${label}`}
                                    className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] font-medium text-zinc-300"
                                  >
                                    {label}
                                  </span>
                                ))
                            : null}
                        </div>
                      </div>
                    ) : null}
                    {r.moderator_note?.trim() ? (
                      <div className="mt-2 rounded-lg border border-sky-500/20 bg-sky-500/10 px-3 py-2">
                        <p className="text-[11px] font-semibold uppercase tracking-wider text-sky-200">
                          Moderator note
                        </p>
                        <p className="mt-1 text-zinc-200">{r.moderator_note.trim()}</p>
                      </div>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {r.status === "open" ? (
                      <form
                        action={async () => {
                          "use server";
                          await resolveReport(r.id, "resolved");
                        }}
                      >
                        <button
                          type="submit"
                          className="rounded-full border border-emerald-500/40 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-500/10"
                        >
                          Resolve
                        </button>
                      </form>
                    ) : (
                      <form
                        action={async () => {
                          "use server";
                          await resolveReport(r.id, "open");
                        }}
                      >
                        <button
                          type="submit"
                          className="rounded-full border border-white/20 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-white/5"
                        >
                          Re-open
                        </button>
                      </form>
                    )}
                    {activeBlocks.has(blockKey(r.reporter_id, r.reported_user_id)) ? (
                      <form
                        action={async () => {
                          "use server";
                          await unblockProfile(r.reporter_id, r.reported_user_id);
                        }}
                      >
                        <button
                          type="submit"
                          className="rounded-full border border-red-500/35 px-3 py-1.5 text-xs font-medium text-red-300 hover:bg-red-500/10"
                        >
                          Unblock pair
                        </button>
                      </form>
                    ) : null}
                    <form
                      action={async () => {
                        "use server";
                        await setReportEscalation(r.id, "watch");
                      }}
                    >
                      <button
                        type="submit"
                        className="rounded-full border border-sky-500/35 px-3 py-1.5 text-xs font-medium text-sky-200 hover:bg-sky-500/10"
                      >
                        Mark watch
                      </button>
                    </form>
                    <form
                      action={async () => {
                        "use server";
                        await setReportEscalation(r.id, "urgent");
                      }}
                    >
                      <button
                        type="submit"
                        className="rounded-full border border-red-500/35 px-3 py-1.5 text-xs font-medium text-red-200 hover:bg-red-500/10"
                      >
                        Mark urgent
                      </button>
                    </form>
                    <form
                      action={async () => {
                        "use server";
                        await setReportEscalation(r.id, "none");
                      }}
                    >
                      <button
                        type="submit"
                        className="rounded-full border border-zinc-500/35 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-500/10"
                      >
                        Clear escalation
                      </button>
                    </form>
                    <form
                      action={async (fd) => {
                        "use server";
                        await setReportModeratorNote(r.id, String(fd.get("note") ?? ""));
                      }}
                      className="flex items-center gap-2"
                    >
                      <input
                        type="text"
                        name="note"
                        defaultValue={r.moderator_note ?? ""}
                        placeholder="Add moderator note"
                        className="w-52 rounded-full border border-white/10 bg-zinc-950/50 px-3 py-1 text-xs text-zinc-200 placeholder:text-zinc-600"
                      />
                      <button
                        type="submit"
                        className="rounded-full border border-amber-500/35 px-3 py-1 text-xs font-medium text-amber-200 hover:bg-amber-500/10"
                      >
                        Save note
                      </button>
                    </form>
                  </div>
                </div>
              </li>
            ))
          )}
        </ul>
      </section>

      <section className="mt-10">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">Blocks</h2>
        <ul className="mt-3 space-y-2">
          {blockRows.length === 0 ? (
            <li className="rounded-xl border border-white/10 bg-zinc-900/40 px-4 py-3 text-sm text-zinc-500">
              No active blocks. The Unblock button appears after someone uses &quot;Block profile&quot; in chat.
            </li>
          ) : (
            blockRows.map((b) => (
              <li key={`${b.blocker_id}:${b.blocked_id}`} className="rounded-xl border border-white/10 bg-zinc-900/40 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1 text-sm text-zinc-300">
                    <p className="text-zinc-500">Blocker: {b.blocker_id}</p>
                    <p className="text-zinc-500">Blocked: {b.blocked_id}</p>
                    {b.reason ? <p className="text-zinc-400">Reason: {b.reason}</p> : null}
                  </div>
                  <form
                    action={async () => {
                      "use server";
                      await unblockProfile(b.blocker_id, b.blocked_id);
                    }}
                  >
                    <button
                      type="submit"
                      className="rounded-full border border-red-500/35 px-3 py-1.5 text-xs font-medium text-red-300 hover:bg-red-500/10"
                    >
                      Unblock
                    </button>
                  </form>
                </div>
              </li>
            ))
          )}
        </ul>
      </section>
    </main>
  );
}
