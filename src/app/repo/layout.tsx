"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { RepoContext } from "@/hooks/use-repo";
import { RepoHeader } from "@/components/repo/repo-header";
import { SiteFooter } from "@/components/shared/site-footer";
import { ChatSidebar } from "@/components/chat/chat-sidebar";
import type { AppMode } from "@/hooks/use-mode";

function RepoLayoutInner({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const repoPath = searchParams.get("path");
  const mode =
    (searchParams.get("mode") as AppMode) || (repoPath ? "local" : "github");
  const githubOwner = searchParams.get("owner");
  const githubRepoName = searchParams.get("repo");

  return (
    <RepoContext.Provider
      value={{ repoPath, mode, githubOwner, githubRepoName }}
    >
      <div className="flex h-screen">
        {/* Content column: header + scrollable main */}
        <div className="flex min-w-0 flex-1 flex-col">
          <RepoHeader />
          <main className="min-h-0 flex-1 overflow-y-auto">
            <div className="page-rails flex min-h-full flex-col">
              {children}
            </div>
            <SiteFooter />
          </main>
        </div>
        {/* Chat sidebar: full viewport height */}
        <ChatSidebar />
      </div>
    </RepoContext.Provider>
  );
}

export default function RepoLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense>
      <RepoLayoutInner>{children}</RepoLayoutInner>
    </Suspense>
  );
}
