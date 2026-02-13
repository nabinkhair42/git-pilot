"use client";

import { Suspense } from "react";
import { BranchList } from "@/components/branches/branch-list";
import { BranchListSkeleton } from "@/components/loaders/branch-list-skeleton";

export default function BranchesPage() {
  return (
    <section>
      <Suspense fallback={<div className="rail-bounded border-t border-border"><BranchListSkeleton /></div>}>
        <BranchList />
      </Suspense>
    </section>
  );
}
