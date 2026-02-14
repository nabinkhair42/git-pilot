"use client";

import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { RepoHeader } from "@/components/repo/repo-header";
import type { AppMode } from "@/hooks/use-mode";
import { RepoContext } from "@/hooks/use-repo";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

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
      <div className="flex min-h-0 flex-1 overflow-clip">
        <div className="flex min-w-0 flex-1 flex-col page-rails">
          <RepoHeader />
          <>{children}</>
        </div>
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
