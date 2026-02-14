"use client";

import { Suspense } from "react";
import { CommitList } from "@/components/commits/commit-list";
import { CommitListSkeleton } from "@/components/loaders/commit-list-skeleton";

export default function CommitsPage() {
  return (
    <Suspense fallback={<CommitListSkeleton />}>
      <CommitList />
    </Suspense>
  );
}
