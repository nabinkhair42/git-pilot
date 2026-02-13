"use client";

import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useRepoInfo, useStatus } from "@/hooks/use-git";
import { useRepoShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { useRepo } from "@/hooks/use-repo";
import {
  Archive,
  CircleDot,
  GitBranch,
  GitCommitHorizontal,
  GitCompareArrows,
  Tag,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { GitManagerAppIcon } from "../icons/git-manager";

const localNavItems = [
  {
    label: "Commits",
    href: "/repo/commits",
    icon: GitCommitHorizontal,
    shortcut: "1",
  },
  { label: "Branches", href: "/repo/branches", icon: GitBranch, shortcut: "2" },
  { label: "Tags", href: "/repo/tags", icon: Tag, shortcut: "3" },
  { label: "Stash", href: "/repo/stash", icon: Archive, shortcut: "4" },
  {
    label: "Compare",
    href: "/repo/compare",
    icon: GitCompareArrows,
    shortcut: "5",
  },
];

// GitHub mode: no stash (no working tree)
const githubNavItems = [
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
  const searchParams = useSearchParams();
  const { mode, repoPath, githubOwner, githubRepoName } = useRepo();
  const isGitHub = mode === "github";

  // Only fetch local data when in local mode
  const { data: repoInfo } = useRepoInfo();
  const { data: status } = useStatus();

  useRepoShortcuts();

  function buildHref(base: string) {
    if (isGitHub) {
      return `${base}?mode=github&owner=${encodeURIComponent(githubOwner || "")}&repo=${encodeURIComponent(githubRepoName || "")}`;
    }
    return `${base}?path=${encodeURIComponent(repoPath || "")}`;
  }

  function isActive(href: string) {
    return pathname.startsWith(href);
  }

  const navItems = isGitHub ? githubNavItems : localNavItems;
  const displayName = isGitHub
    ? `${githubOwner}/${githubRepoName}`
    : (repoPath || "").split("/").pop() || repoPath || "";

  return (
    <header className="shrink-0 border-b border-border bg-background">
      <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-2 px-4 sm:gap-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-2 sm:gap-3">
          <Link
            href={isGitHub ? "/?mode=github" : "/"}
            className="flex min-w-0 items-center gap-2 text-foreground transition-colors hover:text-foreground/80"
          >
            <GitManagerAppIcon className="size-4 shrink-0 sm:size-5" />
            <span className="max-w-30 truncate text-sm font-semibold tracking-tight sm:max-w-50 sm:text-base md:max-w-none">
              {displayName}
            </span>
          </Link>

          {isGitHub && (
            <Badge
              variant="outline"
              className="hidden gap-1.5 border-git-info/30 text-[10px] text-git-info sm:flex"
            >
              GitHub
            </Badge>
          )}

          {!isGitHub && repoInfo && (
            <Badge
              variant="secondary"
              className="hidden gap-1.5 font-mono text-xs sm:flex"
            >
              <GitBranch size={12} />
              {repoInfo.currentBranch}
            </Badge>
          )}

          {!isGitHub && status && !status.isClean && (
            <Badge
              variant="outline"
              className="hidden gap-1.5 border-git-warning/30 text-git-warning sm:flex"
            >
              <CircleDot size={10} />
              Uncommitted
            </Badge>
          )}
        </div>

        <nav className="flex shrink-0 items-center gap-0.5 text-sm sm:gap-1">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link
                    href={buildHref(item.href)}
                    className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 transition-colors sm:px-3 ${
                      active
                        ? "bg-accent text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <item.icon className="size-3.5 sm:size-4" />
                    <span className="hidden sm:inline">{item.label}</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="text-xs">
                  {item.label}
                  <kbd className="ml-2 rounded border border-border bg-muted px-1 py-0.5 font-mono text-[10px]">
                    {item.shortcut}
                  </kbd>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
