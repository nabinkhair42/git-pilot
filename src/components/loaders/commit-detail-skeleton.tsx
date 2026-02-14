"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function CommitDetailSkeleton() {
  return (
    <>
      {/* Header */}
      <div className="px-6">
        <div className="pb-6 pt-8">
          {/* Back button */}
          <Skeleton className="mb-4 h-8 w-36 rounded-md" />

          {/* Commit message */}
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="mt-2 h-4 w-1/2" />

          {/* Author · date · hash */}
          <div className="mt-4 flex items-center gap-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-2 rounded-full" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-2 rounded-full" />
            <Skeleton className="h-5 w-16 rounded" />
          </div>

          {/* Stats */}
          <div className="mt-3 flex items-center gap-3">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-3 w-10" />
            <Skeleton className="h-3 w-10" />
          </div>
        </div>
      </div>



      {/* Changed files */}
      <div className="rail-bounded">
        <div className="px-6 pb-3 pt-6">
          <Skeleton className="h-3 w-24" />
        </div>
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className={`flex items-center gap-3 px-6 py-2.5 ${
              i !== 0 ? "border-t border-dashed border-border" : ""
            }`}
          >
            <Skeleton className="h-4 w-6 shrink-0 rounded" />
            <Skeleton className="h-3.5 w-3.5 shrink-0 rounded" />
            <Skeleton className={`h-4 flex-1 max-w-[${200 + i * 40}px]`} />
            <Skeleton className="ml-auto h-3 w-12 shrink-0" />
          </div>
        ))}
      </div>



      {/* Diff area */}
      <div className="rail-bounded">
        <div className="px-6 pb-3 pt-6">
          <Skeleton className="h-3 w-8" />
        </div>
        <div className="px-6 pb-8">
          {/* Diff block with line-number gutter */}
          <div className="rounded-md border border-border">
            <div className="flex items-center gap-2 border-b border-border px-3 py-2">
              <Skeleton className="h-3 w-48" />
            </div>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="flex border-b border-border/50 last:border-0">
                <Skeleton className="h-5 w-8 shrink-0" />
                <Skeleton className="h-5 w-8 shrink-0" />
                <Skeleton className={`h-5 flex-1 max-w-[${100 + (i % 4) * 80}px] ml-2`} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
