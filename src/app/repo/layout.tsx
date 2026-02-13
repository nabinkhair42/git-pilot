"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { RepoContext } from "@/hooks/use-repo";
import { RepoHeader } from "@/components/repo/repo-header";
import type { AppMode } from "@/hooks/use-mode";

function RepoLayoutInner({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const repoPath = searchParams.get("path");
  const mode = (searchParams.get("mode") as AppMode) || (repoPath ? "local" : "github");
  const githubOwner = searchParams.get("owner");
  const githubRepoName = searchParams.get("repo");

  return (
    <RepoContext.Provider value={{ repoPath, mode, githubOwner, githubRepoName }}>
      <div className="flex min-h-screen flex-col">
        <RepoHeader />
        <div className="page-rails flex flex-1 flex-col">
          {children}
        </div>
      </div>
    </RepoContext.Provider>
  );
}

export default function RepoLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense>
      <RepoLayoutInner>{children}</RepoLayoutInner>
    </Suspense>
  );
}
