"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { GitBranch, GitCommitHorizontal, GitCompareArrows, FolderGit2, CircleDot } from "lucide-react";
import { useRepoInfo, useStatus } from "@/hooks/use-git";
import { Badge } from "@/components/ui/badge";

const navItems = [
  { label: "Commits", href: "/repo/commits", icon: GitCommitHorizontal },
  { label: "Branches", href: "/repo/branches", icon: GitBranch },
  { label: "Compare", href: "/repo/compare", icon: GitCompareArrows },
];

export function RepoHeader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const repoPath = searchParams.get("path") || "";
  const { data: repoInfo } = useRepoInfo();
  const { data: status } = useStatus();

  function buildHref(base: string) {
    return `${base}?path=${encodeURIComponent(repoPath)}`;
  }

  function isActive(href: string) {
    return pathname.startsWith(href);
  }

  const dirName = repoPath.split("/").pop() || repoPath;

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/60 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-3">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="flex items-center gap-2 text-foreground transition-colors hover:text-foreground/80"
          >
            <FolderGit2 size={18} />
            <span className="font-semibold tracking-tight">{dirName}</span>
          </Link>

          {repoInfo && (
            <Badge variant="secondary" className="gap-1.5 font-mono text-xs">
              <GitBranch size={12} />
              {repoInfo.currentBranch}
            </Badge>
          )}

          {status && !status.isClean && (
            <Badge variant="outline" className="gap-1.5 border-yellow-500/30 text-yellow-400">
              <CircleDot size={10} />
              Uncommitted
            </Badge>
          )}
        </div>

        <nav className="flex items-center gap-1 text-sm">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={buildHref(item.href)}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 transition-colors ${
                  active
                    ? "bg-white/[0.06] text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <item.icon size={14} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
