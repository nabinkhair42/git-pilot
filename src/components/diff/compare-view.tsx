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
import { DiffSkeleton } from "@/components/loaders/diff-skeleton";
import { DiffViewer } from "@/components/diff/diff-viewer";
import { PageLayout } from "@/components/shared/page-layout";

export function CompareView() {
  const [fromHash, setFromHash] = useState<string | null>(null);
  const [toHash, setToHash] = useState<string | null>(null);
  const [viewFormat, setViewFormat] = useState<"line-by-line" | "side-by-side">("line-by-line");

  const { data: commitData } = useUnifiedCommits({ maxCount: 100 });
  const { data: diffData, isLoading: diffLoading } = useUnifiedDiff(fromHash, toHash);

  const commits = commitData?.commits || [];

  return (
    <PageLayout
      label="Diff"
      title="Compare Commits"
      filters={
        <div className="flex flex-col gap-3 pb-6 sm:flex-row sm:items-end">
          <div className="flex-1 space-y-1.5">
            <label className="text-sm text-muted-foreground">From (older)</label>
            <Select
              value={fromHash || ""}
              onValueChange={setFromHash}
            >
              <SelectTrigger className="h-9 border-border bg-input/20 font-mono text-xs">
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
              <SelectTrigger className="h-9 border-border bg-input/20 font-mono text-xs">
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
            <SelectTrigger className="h-9 w-full border-border bg-input/20 text-sm sm:w-auto sm:min-w-30">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="line-by-line">Unified</SelectItem>
              <SelectItem value="side-by-side">Split</SelectItem>
            </SelectContent>
          </Select>
        </div>
      }
    >
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
          <DiffSkeleton />
        ) : diffData ? (
          <div className="overflow-x-auto px-6 py-6">
            <DiffViewer diff={diffData.diff} outputFormat={viewFormat} />
          </div>
        ) : null}
      </div>
    </PageLayout>
  );
}
