"use client";

import { Suspense } from "react";
import { CommitList } from "@/components/commits/commit-list";
import { CommitListSkeleton } from "@/components/loaders/commit-list-skeleton";

export default function CommitsPage() {
  return (
    <section>
      <div className="rail-bounded px-4 sm:px-6">
        <div className="pb-2 pt-5 sm:pt-8">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            History
          </p>
          <h2 className="mt-1.5 text-xl font-bold tracking-tight sm:mt-2 sm:text-2xl">Commits</h2>
        </div>
      </div>

      <Suspense fallback={<div className="rail-bounded border-t border-border"><CommitListSkeleton /></div>}>
        <CommitList />
      </Suspense>
    </section>
  );
}
