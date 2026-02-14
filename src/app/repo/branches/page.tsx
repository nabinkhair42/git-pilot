"use client";

import { Suspense } from "react";
import { BranchList } from "@/components/branches/branch-list";
import { BranchListSkeleton } from "@/components/loaders/branch-list-skeleton";

export default function BranchesPage() {
  return (
    <Suspense
      fallback={
          <BranchListSkeleton />
      }
    >
      <BranchList />
    </Suspense>
  );
}
