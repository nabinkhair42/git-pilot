"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function CommitListSkeleton() {
  return (
    <div className="space-y-0">
      {Array.from({ length: 8 }).map((_, i) => (
        <div
          key={i}
          className={`flex items-center gap-4 px-6 py-4 ${
            i !== 0 ? "border-t border-dashed border-border" : ""
          }`}
        >
          <Skeleton className="h-4 w-16 rounded" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4 rounded" />
            <Skeleton className="h-3 w-1/3 rounded" />
          </div>
          <Skeleton className="h-8 w-8 rounded" />
        </div>
      ))}
    </div>
  );
}
