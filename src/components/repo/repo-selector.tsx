"use client";

import { GitHubRepoPicker } from "@/components/github/repo-picker";
import { PathInput } from "@/components/repo/path-input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useMode, type AppMode } from "@/hooks/use-mode";
import { useRecentRepos } from "@/hooks/use-recent-repos";
import { signIn, signOut, useSession } from "@/lib/auth-client";
import { validateRepo } from "@/services/frontend/git.services";
import { ArrowRight, FolderGit2, LogOut, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { GitHub } from "../icons/github";

const isProduction = process.env.NEXT_PUBLIC_VERCEL_ENV === "production";

export function RepoSelector() {
  const searchParams = useSearchParams();
  const initialMode =
    (searchParams.get("mode") as AppMode) ||
    (isProduction ? "github" : "local");
  const { mode, setMode } = useMode();
  const { data: session, isPending: sessionLoading } = useSession();

  // Sync mode from URL on mount
  useEffect(() => {
    const urlMode = isProduction ? "github" : initialMode;
    if (urlMode === "github" || urlMode === "local") {
      setMode(urlMode);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="page-rails flex flex-col min-h-">
      {/* Hero */}
      <section className="relative pt-16">
        <div className="mx-auto w-full max-w-6xl px-4 text-center sm:px-6">
          <div className="pb-8">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-4 py-1.5">
              <span className="size-1.5 animate-pulse rounded-full bg-foreground/40" />
              <span className="text-[13px] text-muted-foreground">
                {mode === "github" ? "GitHub Explorer" : "Local Git Manager"}
              </span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              Git Commit Manager
            </h1>
            <p className="mx-auto mt-4 max-w-md px-4 text-sm leading-relaxed text-muted-foreground sm:px-0 sm:text-base">
              {mode === "github"
                ? "Browse your GitHub repositories — commits, branches, tags, and diffs."
                : "Open any local repository to view history, manage branches, compare diffs, and perform git operations."}
            </p>
          </div>

          {/* Mode switch tabs */}
          {!isProduction ? (
            <div className="mx-auto mb-8 flex w-full max-w-xs items-center rounded-lg border border-border bg-muted/50 p-1">
              <button
                type="button"
                onClick={() => setMode("local")}
                className={`flex flex-1 items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-all sm:gap-2 sm:text-sm ${
                  mode === "local"
                    ? "bg-background text-foreground  border"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <FolderGit2 className="size-3.5 sm:size-4" />
                <span>Local</span>
              </button>
              <button
                type="button"
                onClick={() => setMode("github")}
                className={`flex flex-1 items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-all sm:gap-2 sm:text-sm ${
                  mode === "github"
                    ? "bg-background text-foreground  border"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <GitHub className="size-3.5 sm:size-4" />
                <span>GitHub</span>
              </button>
            </div>
          ) : null}

          {/* Mode content */}
          {mode === "local" ? (
            <LocalModeContent />
          ) : (
            <GitHubModeContent
              session={session}
              sessionLoading={sessionLoading}
            />
          )}
        </div>
      </section>

      {/* Section divider + Recent repos — outside max-w container so divider aligns with rails */}
      {mode === "local" && <LocalModeBottom />}
    </div>
  );
}

// ─── Local mode ─────────────────────────────────────────────────────────────

function LocalModeContent() {
  const [path, setPath] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { addRepo } = useRecentRepos();

  async function openRepo(repoPath: string) {
    if (!repoPath.trim()) return;
    setLoading(true);
    try {
      const result = await validateRepo(repoPath.replace(/\/+$/, ""));
      if (result.valid) {
        addRepo(result.path);
        router.push(`/repo/commits?path=${encodeURIComponent(result.path)}`);
      } else {
        toast.error("Not a valid git repository");
      }
    } catch {
      toast.error("Failed to validate repository path");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="mx-auto mt-4 flex w-full max-w-lg flex-col gap-2 px-4 sm:flex-row sm:items-center sm:px-0">
        <PathInput
          value={path}
          onChange={setPath}
          onSubmit={openRepo}
          disabled={loading}
          placeholder="Start typing a path..."
        />

        <Button
          type="button"
          onClick={() => openRepo(path)}
          disabled={!path.trim()}
          isLoading={loading}
          className="h-11 w-full shrink-0 bg-foreground px-5 text-sm font-medium text-background transition-opacity hover:opacity-80 sm:w-auto"
        >
          Open
          <ArrowRight size={16} className="ml-1" />
        </Button>
      </div>

      <p className="mx-auto mt-3 max-w-md px-4 text-xs text-muted-foreground/60 sm:px-0">
        Type a path to see autocomplete suggestions. Git repos are highlighted
        in green.
      </p>
    </>
  );
}

function RecentRepos({
  repos,
  openRepo,
  removeRepo,
}: {
  repos: string[];
  openRepo: (path: string) => void;
  removeRepo: (path: string) => void;
}) {
  if (repos.length === 0) return null;

  return (
    <div className="rail-bounded border-t border-border">
      <div className="px-4 pb-4 pt-8 sm:px-6">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Recent Repositories
        </p>
      </div>
      <div className="grid gap-0 sm:grid-cols-2">
        {repos.map((repo, i) => (
          <div
            key={repo}
            className={`group flex cursor-pointer items-start gap-3 px-4 py-4 transition-colors hover:bg-muted sm:items-center sm:px-6
              ${i % 2 !== 0 ? "sm:border-l sm:border-dashed sm:border-border" : ""}
              ${i >= 2 ? "sm:border-t sm:border-dashed sm:border-border" : ""}
              ${i >= 1 ? "max-sm:border-t max-sm:border-dashed max-sm:border-border" : ""}
            `}
            onClick={() => openRepo(repo)}
          >
            <FolderGit2 className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground sm:mt-0" />
            <span className="min-w-0 flex-1 break-all text-left font-mono text-sm text-foreground sm:truncate">
              {repo}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeRepo(repo);
              }}
              className="shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-foreground"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

function LocalModeBottom() {
  const { repos, addRepo, removeRepo } = useRecentRepos();
  const router = useRouter();

  async function openRepo(repoPath: string) {
    if (!repoPath.trim()) return;
    try {
      const result = await validateRepo(repoPath.replace(/\/+$/, ""));
      if (result.valid) {
        addRepo(result.path);
        router.push(`/repo/commits?path=${encodeURIComponent(result.path)}`);
      } else {
        toast.error("Not a valid git repository");
      }
    } catch {
      toast.error("Failed to validate repository path");
    }
  }

  if (repos.length === 0) return null;

  return (
    <>
      <div className="section-divider mt-16" aria-hidden="true" />
      <RecentRepos repos={repos} openRepo={openRepo} removeRepo={removeRepo} />
    </>
  );
}

// ─── GitHub mode ────────────────────────────────────────────────────────────

function GitHubModeContent({
  session,
  sessionLoading,
}: {
  session: {
    user: { name: string; image?: string | null; email: string };
  } | null;
  sessionLoading: boolean;
}) {
  const [signInLoading, setSignInLoading] = useState(false);
  const [signOutLoading, setSignOutLoading] = useState(false);

  if (sessionLoading) {
    return (
      <div className="mt-2">
        {/* User info bar skeleton */}
        <div className="mx-auto mb-6 flex max-w-2xl items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-2.5">
          <div className="flex items-center gap-3">
            <Skeleton className="h-7 w-7 rounded-full" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-8 w-20 rounded-md" />
        </div>

        {/* Repo picker skeleton */}
        <div className="mx-auto w-full max-w-2xl">
          <Skeleton className="mb-4 h-11 w-full rounded-md" />
          <div className="rounded-lg border border-border">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 px-4 py-3.5 ${
                  i !== 0 ? "border-t border-border" : ""
                }`}
              >
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-14 rounded-full" />
                  </div>
                  <Skeleton className="h-3 w-3/4" />
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-3 w-10" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="mx-auto max-w-sm py-8">
        <p className="mb-6 text-sm text-muted-foreground">
          Sign in with GitHub to browse your repositories, view commit history,
          and explore diffs — all from the browser.
        </p>
        <Button
          onClick={() => {
            setSignInLoading(true);
            signIn.social({ provider: "github", callbackURL: "/?mode=github" });
          }}
          isLoading={signInLoading}
          className="h-11 gap-2 bg-foreground px-6 text-sm font-medium text-background transition-opacity hover:opacity-80"
        >
          <GitHub className="size-4" /> Sign in with GitHub
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-2 px-2">
      {/* User info bar */}
      <div className="mx-auto mb-6 flex max-w-2xl flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-3">
          {session.user.image && (
            <img
              src={session.user.image}
              alt=""
              className="h-7 w-7 shrink-0 rounded-full"
            />
          )}
          <div className="min-w-0 text-left">
            <span className="block truncate text-sm text-foreground">
              {session.user.name}
            </span>
            <span className="block truncate text-xs text-muted-foreground">
              {session.user.email}
            </span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground"
          isLoading={signOutLoading}
          onClick={() => {
            setSignOutLoading(true);
            signOut();
          }}
        >
          <LogOut size={12} className="mr-1" />
          Sign out
        </Button>
      </div>

      {/* Repo picker */}
      <GitHubRepoPicker />
    </div>
  );
}
