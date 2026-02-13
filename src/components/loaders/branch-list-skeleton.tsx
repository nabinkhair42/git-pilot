"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function BranchListSkeleton() {
  return (
    <div className="space-y-0">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className={`flex items-center gap-4 px-6 py-4 ${
            i !== 0 ? "border-t border-dashed border-border" : ""
          }`}
        >
          <Skeleton className="h-5 w-5 rounded-full" />
          <Skeleton className="h-4 w-40 rounded" />
          <div className="ml-auto flex gap-2">
            <Skeleton className="h-8 w-20 rounded" />
            <Skeleton className="h-8 w-8 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
