"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { GitBranch, GitCommitHorizontal, GitCompareArrows, FolderGit2, Github, CircleDot, Archive, Tag } from "lucide-react";
import { useRepoInfo, useStatus } from "@/hooks/use-git";
import { useRepoShortcuts } from "@/hooks/use-keyboard-shortcuts";
import { useRepo } from "@/hooks/use-repo";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const localNavItems = [
  { label: "Commits", href: "/repo/commits", icon: GitCommitHorizontal, shortcut: "1" },
  { label: "Branches", href: "/repo/branches", icon: GitBranch, shortcut: "2" },
  { label: "Tags", href: "/repo/tags", icon: Tag, shortcut: "3" },
  { label: "Stash", href: "/repo/stash", icon: Archive, shortcut: "4" },
  { label: "Compare", href: "/repo/compare", icon: GitCompareArrows, shortcut: "5" },
];

// GitHub mode: no stash (no working tree)
const githubNavItems = [
  { label: "Commits", href: "/repo/commits", icon: GitCommitHorizontal, shortcut: "1" },
  { label: "Branches", href: "/repo/branches", icon: GitBranch, shortcut: "2" },
  { label: "Tags", href: "/repo/tags", icon: Tag, shortcut: "3" },
  { label: "Compare", href: "/repo/compare", icon: GitCompareArrows, shortcut: "4" },
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
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-3">
        <div className="flex items-center gap-3">
          <Link
            href={isGitHub ? "/?mode=github" : "/"}
            className="flex items-center gap-2 text-foreground transition-colors hover:text-foreground/80"
          >
            {/* Inline logo */}
            <svg viewBox="0 0 32 32" fill="none" className="size-5" xmlns="http://www.w3.org/2000/svg">
              <rect width="32" height="32" rx="6" className="fill-foreground" />
              <g transform="translate(16,16)">
                <line x1="0" y1="-8" x2="0" y2="8" className="stroke-background" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="0" y1="-1" x2="5.5" y2="-6" className="stroke-background" strokeWidth="2.5" strokeLinecap="round" />
                <circle cx="0" cy="-8" r="2" className="fill-foreground stroke-background" strokeWidth="1.8" />
                <circle cx="0" cy="-1" r="2" className="fill-foreground stroke-background" strokeWidth="1.8" />
                <circle cx="0" cy="8" r="2" className="fill-background" />
                <circle cx="5.5" cy="-6" r="2" className="fill-foreground stroke-background" strokeWidth="1.8" />
              </g>
            </svg>
            <span className="font-semibold tracking-tight">{displayName}</span>
          </Link>

          {isGitHub && (
            <Badge variant="outline" className="gap-1.5 border-git-info/30 text-git-info text-[10px]">
              GitHub
            </Badge>
          )}

          {!isGitHub && repoInfo && (
            <Badge variant="secondary" className="gap-1.5 font-mono text-xs">
              <GitBranch size={12} />
              {repoInfo.currentBranch}
            </Badge>
          )}

          {!isGitHub && status && !status.isClean && (
            <Badge variant="outline" className="gap-1.5 border-git-warning/30 text-git-warning">
              <CircleDot size={10} />
              Uncommitted
            </Badge>
          )}
        </div>

        <nav className="flex items-center gap-1 text-sm">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link
                    href={buildHref(item.href)}
                    className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-colors ${
                      active
                        ? "bg-accent text-foreground"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <item.icon size={14} />
                    {item.label}
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
