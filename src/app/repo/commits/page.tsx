"use client";

import { Suspense } from "react";
import { CommitList } from "@/components/commits/commit-list";
import { CommitListSkeleton } from "@/components/loaders/commit-list-skeleton";
import { PageLayout } from "@/components/shared/page-layout";

export default function CommitsPage() {
  return (
    <PageLayout label="History" title="Commits">
      <Suspense
        fallback={
          <div className="rail-bounded">
            <CommitListSkeleton />
          </div>
        }
      >
        <CommitList />
      </Suspense>
    </PageLayout>
  );
}
