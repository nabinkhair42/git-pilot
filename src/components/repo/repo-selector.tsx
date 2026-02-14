"use client";

import { useSession } from "@/lib/auth-client";
import {
  GitHubModeBottom,
  GitHubModeContent,
} from "@/components/repo/github-mode";
import { GitHub } from "../icons/github";

export function RepoSelector() {
  const { data: session, isPending: sessionLoading } = useSession();

  return (
    <div className="flex flex-col rail-bounded">
      {/* Hero */}
      <section className="relative pt-16">
        <div className="rail-bounded px-4 text-center sm:px-6">

          <div className="pb-8">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-muted/50 px-3 py-1">
              <span className="text-[13px] text-muted-foreground">
                <div className="inline-flex items-center gap-1">
                  <GitHub className="size-3" />
                  GitHub
                </div>
              </span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              GitPilot
            </h1>
            <p className="mx-auto mt-4 max-w-md px-4 text-sm leading-relaxed text-muted-foreground sm:px-0 sm:text-base">
              Browse and manage your GitHub repositories — commits, branches, tags, diffs, cherry-pick, revert, and more.
            </p>
          </div>

          <GitHubModeContent
            session={session}
            sessionLoading={sessionLoading}
          />
        </div>
      </section>

      <GitHubModeBottom session={session} sessionLoading={sessionLoading} />
    </div>
  );
}
