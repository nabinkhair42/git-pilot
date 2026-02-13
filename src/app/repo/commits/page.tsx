"use client";

import { Suspense } from "react";
import { CommitList } from "@/components/commits/commit-list";
import { CommitListSkeleton } from "@/components/loaders/commit-list-skeleton";
import { PageHeader } from "@/components/shared/page-header";

export default function CommitsPage() {
  return (
    <section>
      <PageHeader label="History" title="Commits" />

      <Suspense fallback={<div className="rail-bounded border-t border-border"><CommitListSkeleton /></div>}>
        <CommitList />
      </Suspense>
    </section>
  );
}
