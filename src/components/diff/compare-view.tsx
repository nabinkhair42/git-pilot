"use client";

import { useState } from "react";
import { GitCompareArrows } from "lucide-react";
import { useUnifiedCommits, useUnifiedDiff } from "@/hooks/use-unified";
import { formatHash, formatRelativeDate } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { DiffViewer } from "@/components/diff/diff-viewer";

export function CompareView() {
  const [fromHash, setFromHash] = useState<string | null>(null);
  const [toHash, setToHash] = useState<string | null>(null);
  const [viewFormat, setViewFormat] = useState<"line-by-line" | "side-by-side">("line-by-line");

  const { data: commitData } = useUnifiedCommits({ maxCount: 100 });
  const { data: diffData, isLoading: diffLoading } = useUnifiedDiff(fromHash, toHash);

  const commits = commitData?.commits || [];

  return (
    <>
      {/* Selectors */}
      <div className="rail-bounded px-6">
        <div className="pb-6 pt-8">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Diff
          </p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight">Compare Commits</h2>
        </div>

        <div className="flex flex-col gap-3 pb-6 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1.5">
            <label className="text-sm text-muted-foreground">From (older)</label>
            <Select
              value={fromHash || ""}
              onValueChange={setFromHash}
            >
              <SelectTrigger className="h-9 border-border bg-white/[0.03] font-mono text-xs">
                <SelectValue placeholder="Select base commit" />
              </SelectTrigger>
              <SelectContent>
                {commits.map((c) => (
                  <SelectItem key={c.hash} value={c.hash} className="font-mono text-xs">
                    {formatHash(c.hash)} {c.message.slice(0, 50)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <GitCompareArrows size={18} className="hidden shrink-0 text-muted-foreground sm:block" />

          <div className="flex-1 space-y-1.5">
            <label className="text-sm text-muted-foreground">To (newer)</label>
            <Select
              value={toHash || ""}
              onValueChange={setToHash}
            >
              <SelectTrigger className="h-9 border-border bg-white/[0.03] font-mono text-xs">
                <SelectValue placeholder="Select target commit" />
              </SelectTrigger>
              <SelectContent>
                {commits.map((c) => (
                  <SelectItem key={c.hash} value={c.hash} className="font-mono text-xs">
                    {formatHash(c.hash)} {c.message.slice(0, 50)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Select value={viewFormat} onValueChange={(v) => setViewFormat(v as typeof viewFormat)}>
            <SelectTrigger className="h-9 w-auto min-w-[120px] border-border bg-white/[0.03] text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="line-by-line">Unified</SelectItem>
              <SelectItem value="side-by-side">Split</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="section-divider" aria-hidden="true" />

      {/* Diff output */}
      <div className="rail-bounded border-t border-border">
        {!fromHash || !toHash ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-sm text-muted-foreground">
              Select two commits to compare
            </p>
          </div>
        ) : diffLoading ? (
          <div className="space-y-4 px-6 py-8">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-64 w-full" />
          </div>
        ) : diffData ? (
          <div className="overflow-x-auto px-6 py-6">
            <DiffViewer diff={diffData.diff} outputFormat={viewFormat} />
          </div>
        ) : null}
      </div>
    </>
  );
}
