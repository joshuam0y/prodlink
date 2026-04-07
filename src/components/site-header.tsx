"use client";

import type { User } from "@supabase/supabase-js";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { IconType } from "react-icons";
import {
  HiOutlineBell,
  HiOutlineBookOpen,
  HiOutlineChatBubbleLeftRight,
  HiOutlineCube,
  HiOutlineHeart,
  HiOutlineLifebuoy,
  HiOutlineMagnifyingGlass,
  HiOutlineUserCircle,
} from "react-icons/hi2";
import { useThemeSetting } from "@/components/theme-provider";
import { signOut } from "@/app/auth/actions";
import { MobileTabBar } from "@/components/mobile-tab-bar";
import { ProfileAvatar } from "@/components/profile-avatar";
import { ShareAppButton } from "@/components/share-app-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { MobileNavLink } from "@/components/mobile-nav-link";
import type { MobileApiResponse, MobileUnreadCounts } from "@/lib/mobile-api/types";

const allNavLinks = [
  { href: "/explore", label: "Discover" },
  { href: "/points", label: "Points", authOnly: true },
  { href: "/likes", label: "Likes", authOnly: true },
  { href: "/matches", label: "Messages", authOnly: true },
  { href: "/notifications", label: "Notifications", authOnly: true },
  { href: "/bundles", label: "Bundles" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/help", label: "Help" },
  { href: "/onboarding", label: "Profile", hideWhenProfileComplete: true },
] as const;

const navLinkIcon: Partial<Record<string, IconType>> = {
  "/explore": HiOutlineMagnifyingGlass,
  "/points": HiOutlineCube,
  "/likes": HiOutlineHeart,
  "/matches": HiOutlineChatBubbleLeftRight,
  "/notifications": HiOutlineBell,
  "/bundles": HiOutlineCube,
  "/how-it-works": HiOutlineBookOpen,
  "/help": HiOutlineLifebuoy,
  "/onboarding": HiOutlineUserCircle,
  "/profile": HiOutlineUserCircle,
};

type Props = {
  user: User | null;
  isAdmin?: boolean;
  profileAvatarUrl?: string | null;
  supabaseEnabled: boolean;
  unreadMessages?: number;
  unreadNotifications?: number;
  pointsBalance?: number;
  outreachCreditsBalance?: number;
  /** When false, hide the Profile → onboarding link (user finished questionnaire). */
  showBuildProfileNav?: boolean;
};

export function SiteHeader({
  user,
  isAdmin = false,
  profileAvatarUrl = null,
  supabaseEnabled,
  unreadMessages = 0,
  unreadNotifications = 0,
  pointsBalance: _pointsBalance = 0,
  outreachCreditsBalance = 0,
  showBuildProfileNav = true,
}: Props) {
  const { theme } = useThemeSetting();
  const [counts, setCounts] = useState({
    unreadMessages,
    unreadNotifications,
  });

  const logoSrc = theme === "light" ? "/prodlink-logo-light.svg" : "/prodlink-logo-v2.svg";

  // Keep client badge counts aligned when the server layout re-renders (navigation, etc.).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- sync polled UI with fresh SSR props
    setCounts({ unreadMessages, unreadNotifications });
  }, [unreadMessages, unreadNotifications]);

  useEffect(() => {
    if (!supabaseEnabled || !user) return;

    let isActive = true;

    const refreshCounts = async () => {
      try {
        const res = await fetch("/api/mobile/me/counts", {
          method: "GET",
          cache: "no-store",
        });
        if (!res.ok) return;
        const payload = (await res.json()) as MobileApiResponse<MobileUnreadCounts>;
        if (!isActive || !payload.ok) return;
        setCounts({
          unreadMessages: payload.data.unreadMessages,
          unreadNotifications: payload.data.unreadNotifications,
        });
      } catch {
        // Keep the last known counts when the refresh fails.
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void refreshCounts();
      }
    };

    void refreshCounts();
    const intervalId = window.setInterval(() => {
      if (document.visibilityState === "visible") {
        void refreshCounts();
      }
    }, 15000);
    window.addEventListener("focus", refreshCounts);
    document.addEventListener("visibilitychange", onVisibilityChange);
    const onUnreadCountsRefresh = () => {
      void refreshCounts();
    };
    window.addEventListener("prodlink:unread-counts-refresh", onUnreadCountsRefresh);

    return () => {
      isActive = false;
      window.clearInterval(intervalId);
      window.removeEventListener("focus", refreshCounts);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("prodlink:unread-counts-refresh", onUnreadCountsRefresh);
    };
  }, [supabaseEnabled, user]);

  const links = (showBuildProfileNav
    ? allNavLinks
    : allNavLinks.filter(
        (l) => !("hideWhenProfileComplete" in l && l.hideWhenProfileComplete),
      )
  ).filter((l) => !("authOnly" in l && l.authOnly) || Boolean(user));

  /** Landing `/` is for signed-out users only; signed-in users go to Discover. */
  const brandHref = user && supabaseEnabled ? "/explore" : "/";

  const badgeForHref = (href: string) => {
    if (href === "/matches" && counts.unreadMessages > 0) {
      return counts.unreadMessages > 9 ? "9+" : String(counts.unreadMessages);
    }
    if (href === "/notifications" && counts.unreadNotifications > 0) {
      return counts.unreadNotifications > 9 ? "9+" : String(counts.unreadNotifications);
    }
    return null;
  };

  // Sidebar display intentionally fixed to zero per current product behavior.
  const sidebarPointsBalance = 0;

  return (
    <>
      <header className="sticky top-0 z-50 border-b border-white/10 bg-[var(--surface)]/80 backdrop-blur-md md:hidden">
        <div className="mx-auto max-w-5xl px-3 py-2 sm:flex sm:h-14 sm:items-center sm:justify-between sm:gap-3 sm:px-6 sm:py-0">
          <div className="flex items-center justify-between gap-3">
            <Link href={brandHref} className="inline-flex shrink-0" aria-label="prodLink home">
              <Image
                src={logoSrc}
                alt="prodLink"
                width={210}
                height={55}
                className="h-8 w-auto"
                priority
              />
            </Link>

            <details className="group relative">
              <summary className="flex h-9 min-w-9 cursor-pointer list-none items-center justify-center rounded-full border border-white/10 bg-zinc-950/40 px-3 text-zinc-300 transition hover:bg-white/5 hover:text-zinc-100 [&::-webkit-details-marker]:hidden">
                <span className="text-lg leading-none group-open:hidden">≡</span>
                <span className="text-lg leading-none hidden group-open:inline">×</span>
              </summary>
              <div className="absolute right-0 mt-2 w-56 max-w-[calc(100vw-1.5rem)] rounded-xl border border-white/10 bg-zinc-950/97 p-1.5 shadow-2xl backdrop-blur">
                <nav className="flex flex-col gap-0.5">
                  {links.map(({ href, label }) => {
                    const badge = badgeForHref(href);
                    return (
                      <MobileNavLink
                        key={href}
                        href={href}
                        className="rounded-lg px-3 py-2 text-sm text-zinc-300 transition-colors hover:bg-white/5 hover:text-zinc-100"
                      >
                        <span className="flex items-center justify-between gap-3">
                          {label}
                          {badge ? (
                            <span className="inline-flex min-w-[1rem] items-center justify-center rounded-full bg-amber-500 px-1.5 text-[10px] font-semibold text-zinc-950">
                              {badge}
                            </span>
                          ) : null}
                        </span>
                      </MobileNavLink>
                    );
                  })}
                  {supabaseEnabled ? (
                    user ? (
                      <>
                        {isAdmin ? (
                          <MobileNavLink
                            href="/admin/moderation"
                            className="rounded-lg px-3 py-2 text-sm text-zinc-300 transition-colors hover:bg-white/5 hover:text-zinc-100"
                          >
                            Moderation
                          </MobileNavLink>
                        ) : null}
                        {!showBuildProfileNav ? (
                          <MobileNavLink
                            href="/profile"
                            className="rounded-lg px-3 py-2 text-sm text-zinc-300 transition-colors hover:bg-white/5 hover:text-zinc-100"
                          >
                            <span className="flex items-center gap-2">
                              <ProfileAvatar
                                name={user.email}
                                avatarUrl={profileAvatarUrl}
                                sizeClassName="h-6 w-6"
                                textClassName="text-[10px] font-semibold text-zinc-100"
                                ringClassName="border border-white/10 bg-zinc-800/60"
                              />
                              Profile
                            </span>
                          </MobileNavLink>
                        ) : null}
                        <form action={signOut}>
                          <button
                            type="submit"
                            className="w-full rounded-lg px-3 py-2 text-left text-sm text-zinc-300 transition hover:bg-white/5 hover:text-zinc-100"
                          >
                            Sign out
                          </button>
                        </form>
                      </>
                    ) : (
                      <>
                        <MobileNavLink
                          href="/login"
                          className="rounded-lg px-3 py-2 text-sm text-zinc-300 transition hover:bg-white/5 hover:text-zinc-100"
                        >
                          Sign in
                        </MobileNavLink>
                        <MobileNavLink
                          href="/signup"
                          className="rounded-lg bg-amber-500/15 px-3 py-2 text-sm font-medium text-amber-400 ring-1 ring-amber-500/30 transition hover:bg-amber-500/25"
                        >
                          Sign up
                        </MobileNavLink>
                      </>
                    )
                  ) : null}
                </nav>
                <div className="mt-1.5 space-y-2 border-t border-white/10 pt-1.5">
                  <ThemeToggle className="px-1" />
                  <ShareAppButton
                    className="w-full rounded-lg border border-white/10 bg-white/[0.04] px-3 py-2 text-left text-sm text-zinc-300 transition hover:bg-white/8 hover:text-zinc-100"
                    idleLabel="Share ProdLink"
                    copiedLabel="Invite link copied"
                  />
                </div>
              </div>
            </details>
          </div>
        </div>
      </header>

      <aside className="hidden border-r border-white/10 bg-[var(--surface)]/92 md:sticky md:top-0 md:flex md:h-[100dvh] md:w-[248px] md:flex-col md:overflow-hidden md:px-3 md:py-3">
        <div className="flex min-h-0 w-full flex-1 flex-col gap-2.5">
          <Link href={brandHref} className="inline-flex shrink-0 self-start" aria-label="prodLink home">
            <Image
              src={logoSrc}
              alt="prodLink"
              width={210}
              height={55}
              className="h-8 w-auto"
              priority
            />
          </Link>
          <nav className="flex min-h-0 w-full flex-1 flex-col gap-1 pr-1">
            {links.map(({ href, label }) => {
              const badge = badgeForHref(href);
              const Icon = navLinkIcon[href];
              return (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center gap-2.5 rounded-xl border border-transparent px-2.5 py-1.5 text-[15px] font-medium text-zinc-300 transition hover:border-white/10 hover:bg-white/5 hover:text-zinc-50"
                >
                  {Icon ? (
                    <Icon className="h-4 w-4 shrink-0 text-zinc-500" aria-hidden />
                  ) : (
                    <span className="h-4 w-4 shrink-0" aria-hidden />
                  )}
                  <span className="min-w-0 flex-1 leading-snug">{label}</span>
                  {badge ? (
                    <span className="inline-flex min-w-[1.25rem] shrink-0 items-center justify-center rounded-full bg-amber-500 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-950">
                      {badge}
                    </span>
                  ) : null}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="mt-2.5 flex w-full shrink-0 flex-col gap-1.5 border-t border-white/10 pt-2.5">
          {user ? (
            <Link
              href="/points"
              className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-2.5 py-2 transition hover:bg-amber-500/15"
            >
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-400/90">
                Points
              </p>
              <p className="mt-0.5 text-base font-semibold text-zinc-100">{sidebarPointsBalance}</p>
              <p className="mt-0.5 text-[11px] text-zinc-400">
                Outreach credits: {outreachCreditsBalance}
              </p>
            </Link>
          ) : null}
          <ThemeToggle />
          <ShareAppButton
            className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-2.5 py-2 text-left text-sm font-medium text-zinc-300 transition hover:border-white/15 hover:bg-white/7 hover:text-zinc-50"
            idleLabel="Invite friends"
            copiedLabel="Invite link copied"
          />
          {supabaseEnabled ? (
            user ? (
              <>
                {isAdmin ? (
                  <Link
                    href="/admin/moderation"
                    className="rounded-xl border border-transparent px-2.5 py-2 text-sm font-medium text-zinc-300 transition hover:border-white/10 hover:bg-white/5 hover:text-zinc-50"
                  >
                    Moderation
                  </Link>
                ) : null}
                {!showBuildProfileNav ? (
                  <Link
                    href="/profile"
                    className="flex items-center gap-2.5 rounded-xl border border-transparent px-2.5 py-2 text-sm font-medium text-zinc-300 transition hover:border-white/10 hover:bg-white/5 hover:text-zinc-50"
                  >
                    <ProfileAvatar
                      name={user.email}
                      avatarUrl={profileAvatarUrl}
                      sizeClassName="h-7 w-7"
                      textClassName="text-[10px] font-semibold text-zinc-100"
                      ringClassName="border border-white/10 bg-zinc-800/60"
                    />
                    <span>Profile</span>
                  </Link>
                ) : null}
                <form action={signOut}>
                  <button
                    type="submit"
                    className="w-full rounded-xl border border-white/10 bg-zinc-950/35 px-2.5 py-2 text-left text-sm font-medium text-zinc-300 transition hover:border-white/15 hover:bg-white/5 hover:text-zinc-50"
                  >
                    Sign out
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="rounded-xl border border-transparent px-2.5 py-2 text-sm font-medium text-zinc-300 transition hover:border-white/10 hover:bg-white/5 hover:text-zinc-50"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="rounded-xl border border-amber-500/30 bg-amber-500/15 px-2.5 py-2 text-sm font-medium text-amber-300 transition hover:bg-amber-500/25"
                >
                  Sign up
                </Link>
              </>
            )
          ) : null}
        </div>
      </aside>
      <MobileTabBar
        signedIn={Boolean(user)}
        profileAvatarUrl={profileAvatarUrl}
        profileName={user?.email ?? null}
        unreadMessages={counts.unreadMessages}
        unreadNotifications={counts.unreadNotifications}
        showBuildProfileNav={showBuildProfileNav}
      />
    </>
  );
}
