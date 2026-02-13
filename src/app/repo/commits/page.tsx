"use client";

import { Suspense } from "react";
import { CommitList } from "@/components/commits/commit-list";
import { CommitListSkeleton } from "@/components/loaders/commit-list-skeleton";

export default function CommitsPage() {
  return (
    <section>
      <div className="rail-bounded px-6">
        <div className="pb-2 pt-8">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            History
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight">Commits</h2>
        </div>
      </div>

      <Suspense fallback={<div className="rail-bounded border-t border-border"><CommitListSkeleton /></div>}>
        <CommitList />
      </Suspense>
    </section>
  );
}
