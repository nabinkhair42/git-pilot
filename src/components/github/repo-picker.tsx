"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  GitBranch,
  Lock,
  Star,
  Search,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useGitHubRepos } from "@/hooks/use-github";
import { useMode, type GitHubRepo } from "@/hooks/use-mode";

export function GitHubRepoPicker() {
  const { data: repos, isLoading, error } = useGitHubRepos();
  const { setGitHubRepo } = useMode();
  const router = useRouter();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!repos) return [];
    if (!search) return repos;
    const q = search.toLowerCase();
    return repos.filter(
      (r) =>
        r.fullName.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q) ||
        r.language?.toLowerCase().includes(q)
    );
  }, [repos, search]);

  function selectRepo(repo: (typeof filtered)[0]) {
    const ghRepo: GitHubRepo = {
      owner: repo.owner,
      name: repo.name,
      fullName: repo.fullName,
      defaultBranch: repo.defaultBranch,
      isPrivate: repo.isPrivate,
    };
    setGitHubRepo(ghRepo);
    router.push(
      `/repo/commits?mode=github&owner=${encodeURIComponent(repo.owner)}&repo=${encodeURIComponent(repo.name)}`
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        <span className="ml-3 text-sm text-muted-foreground">
          Loading repositories...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="py-8 text-center text-sm text-muted-foreground">
        Failed to load repositories. Make sure your GitHub connection is active.
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      {/* Search */}
      <div className="relative mb-4">
        <Search
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search repositories..."
          className="h-11 pl-10"
        />
      </div>

      {/* Repo list */}
      <ScrollArea className="h-[400px] rounded-lg border border-border">
        {filtered.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            {search ? "No matching repositories" : "No repositories found"}
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filtered.map((repo) => (
              <button
                key={repo.fullName}
                type="button"
                onClick={() => selectRepo(repo)}
                className="group flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors hover:bg-white/[0.03]"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-mono text-sm font-medium text-foreground">
                      {repo.fullName}
                    </span>
                    {repo.isPrivate && (
                      <Lock className="h-3 w-3 shrink-0 text-muted-foreground" />
                    )}
                    {repo.language && (
                      <Badge
                        variant="secondary"
                        className="shrink-0 text-[10px] font-normal"
                      >
                        {repo.language}
                      </Badge>
                    )}
                  </div>
                  {repo.description && (
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {repo.description}
                    </p>
                  )}
                  <div className="mt-1.5 flex items-center gap-3 text-[11px] text-muted-foreground/60">
                    <span className="flex items-center gap-1">
                      <GitBranch className="h-3 w-3" />
                      {repo.defaultBranch}
                    </span>
                    {(repo.stargazersCount ?? 0) > 0 && (
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3" />
                        {repo.stargazersCount}
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                >
                  Open <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </button>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
