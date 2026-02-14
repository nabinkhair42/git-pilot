"use client";

import { Suspense } from "react";
import { TagList } from "@/components/tags/tag-list";
import { Skeleton } from "@/components/ui/skeleton";

function TagsSkeleton() {
  return (
    <div className="space-y-0">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className={`flex items-center gap-4 px-6 py-4 ${
            i !== 0 ? "border-t border-dashed border-border" : ""
          }`}
        >
          <Skeleton className="size-5 rounded" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-3 w-1/5" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function TagsPage() {
  return (
    <Suspense
      fallback={<TagsSkeleton />}
    >
      <TagList />
    </Suspense>
  );
}
