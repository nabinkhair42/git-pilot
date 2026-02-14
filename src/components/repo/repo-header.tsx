"use client";

import { Kbd } from "@/components/ui/kbd";
import { useRepoShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { useRepo } from "@/hooks/use-repo";
import {
  GitBranch,
  GitCommitHorizontal,
  GitCompareArrows,
  Keyboard,
  Tag,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  {
    label: "Commits",
    href: "/repo/commits",
    icon: GitCommitHorizontal,
    shortcut: "1",
  },
  { label: "Branches", href: "/repo/branches", icon: GitBranch, shortcut: "2" },
  { label: "Tags", href: "/repo/tags", icon: Tag, shortcut: "3" },
  {
    label: "Compare",
    href: "/repo/compare",
    icon: GitCompareArrows,
    shortcut: "4",
  },
];

export function RepoHeader() {
  const pathname = usePathname();
  const { githubOwner, githubRepoName } = useRepo();

  useRepoShortcuts();

  function buildHref(base: string) {
    return `${base}?owner=${encodeURIComponent(githubOwner || "")}&repo=${encodeURIComponent(githubRepoName || "")}`;
  }

  function isActive(href: string) {
    return pathname.startsWith(href);
  }

  const displayName = `${githubOwner}/${githubRepoName}`;

  return (
    <header className="border-b border-border bg-background">
      <div className="flex h-14 rail-bounded items-center justify-between gap-2 px-4 sm:gap-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <Link
            href="/"
            className="flex min-w-0 items-center gap-2 text-foreground transition-colors hover:text-foreground/80"
          >
            <span className="max-w-30 truncate text-sm font-semibold tracking-tight sm:max-w-50 sm:text-base md:max-w-none">
              {displayName}
            </span>
          </Link>

          <Kbd className="border-git-info/30 text-git-info">GitHub</Kbd>
        </div>

        <nav className="flex shrink-0 items-center gap-0.5 text-sm sm:gap-1">
          {navItems.map((item, index) => {
            const active = isActive(item.href);
            return (
              <Link
                key={index}
                href={buildHref(item.href)}
                className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 transition-colors sm:px-3 ${
                  active
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <item.icon className="size-3.5 sm:size-4" />
                <span className="hidden sm:inline">{item.label}</span>
                <Kbd className="hidden sm:inline-flex">
                  <Keyboard size={12} />
                  {item.shortcut}
                </Kbd>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
