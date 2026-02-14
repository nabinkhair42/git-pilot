"use client";

import { useMode, type AppMode } from "@/hooks/use-mode";
import { useSession } from "@/lib/auth-client";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { ModeSwitcher } from "@/components/shared/mode-switcher";
import { GitHubModeContent } from "@/components/repo/github-mode";
import { LocalModeBottom, LocalModeContent } from "@/components/repo/local-mode";

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
    <div className="page-rails flex flex-col">
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
          {!isProduction && <ModeSwitcher />}

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
