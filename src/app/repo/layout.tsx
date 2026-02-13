"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { RepoContext } from "@/hooks/use-repo";
import { RepoHeader } from "@/components/repo/repo-header";

function RepoLayoutInner({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const repoPath = searchParams.get("path");

  return (
    <RepoContext.Provider value={{ repoPath }}>
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
