"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  HiOutlineArrowPath,
  HiOutlineBookOpen,
  HiOutlineChatBubbleLeftRight,
  HiOutlineFlag,
  HiOutlineMap,
  HiOutlineUserCircle,
} from "react-icons/hi2";

const TOPICS = [
  { href: "/how-it-works", label: "Overview", exact: true as const, Icon: HiOutlineBookOpen },
  { href: "/how-it-works/profile", label: "Your profile", exact: false as const, Icon: HiOutlineUserCircle },
  { href: "/how-it-works/discover", label: "Discover", exact: false as const, Icon: HiOutlineMap },
  { href: "/how-it-works/connect", label: "Match & message", exact: false as const, Icon: HiOutlineChatBubbleLeftRight },
  { href: "/how-it-works/roles", label: "Who it's for", exact: false as const, Icon: HiOutlineFlag },
  { href: "/how-it-works/roadmap", label: "Beta & roadmap", exact: false as const, Icon: HiOutlineArrowPath },
] as const;

function isActive(pathname: string, href: string, exact?: boolean) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function HowItWorksNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="How it works sections"
      className="shrink-0 lg:w-52"
    >
      <p className="mb-3 hidden text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500 lg:block">
        Topics
      </p>
      <ul className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] lg:flex-col lg:gap-1 lg:overflow-visible lg:pb-0 [&::-webkit-scrollbar]:hidden">
        {TOPICS.map(({ href, label, exact, Icon }) => {
          const active = isActive(pathname, href, exact);
          return (
            <li key={href} className="shrink-0 lg:shrink">
              <Link
                href={href}
                className={`flex items-center gap-2.5 rounded-2xl border px-3 py-2.5 text-sm font-medium transition lg:w-full lg:py-2.5 lg:text-base ${
                  active
                    ? "border-amber-500/35 bg-amber-500/10 text-amber-200"
                    : "border-transparent text-zinc-400 hover:border-white/10 hover:bg-white/5 hover:text-zinc-100"
                }`}
              >
                <Icon className="h-5 w-5 shrink-0 opacity-90" aria-hidden />
                <span className="whitespace-nowrap">{label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
