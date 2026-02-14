"use client";

import { Suspense } from "react";
import { StashList } from "@/components/stash/stash-list";
import { Skeleton } from "@/components/ui/skeleton";

function StashSkeleton() {
  return (
    <div className="space-y-0">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className={`flex items-center gap-4 px-6 py-4 ${
            i !== 0 ? "border-t border-dashed border-border" : ""
          }`}
        >
          <Skeleton className="size-5 rounded" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-3 w-1/4" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function StashPage() {
  return (
    <Suspense
      fallback={<StashSkeleton />}
    >
      <StashList />
    </Suspense>
  );
}
