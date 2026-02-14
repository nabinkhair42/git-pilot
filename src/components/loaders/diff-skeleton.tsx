"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function DiffSkeleton() {
  return (
    <div className="rail-bounded">
      <div className="px-6 pb-8 pt-6">
        {/* Diff block mimicking a unified diff */}
        <div className="rounded-md border border-border">
          {/* File header */}
          <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-3 py-2">
            <Skeleton className="h-3 w-48" />
            <Skeleton className="ml-auto h-3 w-16" />
          </div>

          {/* Hunk header */}
          <div className="border-b border-border bg-muted/20 px-3 py-1.5">
            <Skeleton className="h-3 w-40" />
          </div>

          {/* Diff lines */}
          {Array.from({ length: 12 }).map((_, i) => {
            const isAdd = i === 3 || i === 4;
            const isDel = i === 7;
            return (
              <div
                key={i}
                className={`flex border-b border-border/30 last:border-0 ${
                  isAdd ? "bg-git-added/[0.04]" : isDel ? "bg-git-deleted/[0.04]" : ""
                }`}
              >
                <Skeleton className="h-5 w-8 shrink-0 rounded-none opacity-40" />
                <Skeleton className="h-5 w-8 shrink-0 rounded-none opacity-40" />
                <div className="flex-1 px-2 py-0.5">
                  <Skeleton className={`h-4 ${["w-3/4", "w-1/2", "w-2/3", "w-4/5", "w-1/3", "w-3/5", "w-2/5", "w-4/5", "w-1/4", "w-3/4", "w-2/3", "w-1/2"][i]}`} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
