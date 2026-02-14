"use client";

import { useMode, type AppMode } from "@/hooks/use-mode";
import { useSession } from "@/lib/auth-client";
import { useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { ModeSwitcher } from "@/components/shared/mode-switcher";
import {
  GitHubModeBottom,
  GitHubModeContent,
} from "@/components/repo/github-mode";
import {
  LocalModeBottom,
  LocalModeContent,
} from "@/components/repo/local-mode";
import { GitHub } from "../icons/github";
import { FolderGit2 } from "lucide-react";

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
    <div className="flex flex-col">
      {/* Hero */}
      <section className="relative pt-16">
        <div className="rail-bounded px-4 text-center sm:px-6">

          <div className="pb-8">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-1">
              <span className="text-[13px] text-muted-foreground">
                {mode === "github" ? (
                  <div className="inline-flex items-center gap-1">
                    <GitHub className="size-3" />
                    GitHub Mode
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1">
                    <FolderGit2 className="size-3" />
                    Local Mode
                  </div>
                )}
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
      {mode === "github" && (
        <GitHubModeBottom session={session} sessionLoading={sessionLoading} />
      )}
    </div>
  );
}
