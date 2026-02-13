"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  FolderGit2,
  Github,
  X,
  ArrowRight,
  LogOut,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useRecentRepos } from "@/hooks/use-recent-repos";
import { validateRepo } from "@/services/frontend/git.services";
import { PathInput } from "@/components/repo/path-input";
import { GitHubRepoPicker } from "@/components/github/repo-picker";
import { useMode, type AppMode } from "@/hooks/use-mode";
import { signIn, signOut, useSession } from "@/lib/auth-client";

export function RepoSelector() {
  const searchParams = useSearchParams();
  const initialMode = (searchParams.get("mode") as AppMode) || "local";
  const { mode, setMode } = useMode();
  const { data: session, isPending: sessionLoading } = useSession();

  // Sync mode from URL on mount
  useState(() => {
    if (initialMode === "github" || initialMode === "local") {
      setMode(initialMode);
    }
  });

  return (
    <div className="page-rails flex min-h-screen flex-col">
      {/* Hero */}
      <section className="relative pt-24 sm:pt-32">
        <div className="mx-auto w-full max-w-6xl px-6 text-center">
          <div className="pb-8">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.04] px-4 py-1.5">
              <FolderGit2 size={14} className="text-white/40" />
              <span className="text-[13px] text-white/60">
                {mode === "github" ? "GitHub Explorer" : "Local Git Manager"}
              </span>
            </div>

            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              Git Commit Manager
            </h1>
            <p className="mx-auto mt-4 max-w-md text-base text-muted-foreground">
              {mode === "github"
                ? "Browse your GitHub repositories — commits, branches, tags, and diffs."
                : "Open any local repository to view history, manage branches, compare diffs, and perform git operations."}
            </p>
          </div>

          {/* Mode switch tabs */}
          <div className="mx-auto mb-8 flex max-w-xs items-center rounded-lg border border-border bg-white/[0.02] p-1">
            <button
              type="button"
              onClick={() => setMode("local")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all ${
                mode === "local"
                  ? "bg-foreground text-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <FolderGit2 size={14} />
              Local
            </button>
            <button
              type="button"
              onClick={() => setMode("github")}
              className={`flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all ${
                mode === "github"
                  ? "bg-foreground text-background shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Github size={14} />
              GitHub
            </button>
          </div>

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
    </div>
  );
}

// ─── Local mode ─────────────────────────────────────────────────────────────

function LocalModeContent() {
  const [path, setPath] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { repos, addRepo, removeRepo } = useRecentRepos();

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
      <div className="mx-auto mt-4 flex max-w-lg items-center gap-2">
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
          disabled={loading || !path.trim()}
          className="h-11 shrink-0 bg-foreground px-5 text-sm font-medium text-background transition-opacity hover:opacity-80"
        >
          {loading ? "Validating..." : "Open"}
          {!loading && <ArrowRight size={16} className="ml-1" />}
        </Button>
      </div>

      <p className="mx-auto mt-3 max-w-md text-xs text-muted-foreground/60">
        Type a path to see autocomplete suggestions. Git repos are highlighted
        in green.
      </p>

      <div className="section-divider mt-16" aria-hidden="true" />

      {/* Recent repos */}
      {repos.length > 0 && (
        <div className="rail-bounded border-t border-border">
          <div className="px-6 pb-4 pt-8">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Recent Repositories
            </p>
          </div>
          <div className="grid sm:grid-cols-2">
            {repos.map((repo, i) => (
              <div
                key={repo}
                className={`group flex items-center gap-3 px-6 py-4 transition-colors hover:bg-white/[0.02]
                  ${i % 2 !== 0 ? "sm:border-l sm:border-dashed sm:border-border" : ""}
                  ${i >= 2 ? "sm:border-t sm:border-dashed sm:border-border" : ""}
                  ${i >= 1 ? "max-sm:border-t max-sm:border-dashed max-sm:border-border" : ""}
                `}
              >
                <FolderGit2
                  size={16}
                  className="shrink-0 text-muted-foreground"
                />
                <button
                  type="button"
                  onClick={() => openRepo(repo)}
                  className="min-w-0 flex-1 truncate text-left font-mono text-sm text-foreground transition-colors hover:text-foreground/80"
                >
                  {repo}
                </button>
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
      )}
    </>
  );
}

// ─── GitHub mode ────────────────────────────────────────────────────────────

function GitHubModeContent({
  session,
  sessionLoading,
}: {
  session: { user: { name: string; image?: string | null; email: string } } | null;
  sessionLoading: boolean;
}) {
  if (sessionLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
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
          onClick={() =>
            signIn.social({ provider: "github", callbackURL: "/?mode=github" })
          }
          className="h-11 gap-2 bg-foreground px-6 text-sm font-medium text-background transition-opacity hover:opacity-80"
        >
          <Github size={16} />
          Sign in with GitHub
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-2">
      {/* User info bar */}
      <div className="mx-auto mb-6 flex max-w-2xl items-center justify-between rounded-lg border border-border bg-white/[0.02] px-4 py-2.5">
        <div className="flex items-center gap-3">
          {session.user.image && (
            <img
              src={session.user.image}
              alt=""
              className="h-7 w-7 rounded-full"
            />
          )}
          <span className="text-sm text-foreground">{session.user.name}</span>
          <span className="text-xs text-muted-foreground">
            {session.user.email}
          </span>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground"
          onClick={() => signOut()}
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
