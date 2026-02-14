"use client";

import { useState } from "react";
import { GitCompareArrows, AlignJustify, Columns2 } from "lucide-react";
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
import { PageLayout } from "@/components/shared/page-layout";
import dynamic from "next/dynamic";

const DiffViewer = dynamic(
  () => import("@/components/diff/diff-viewer"),
  { loading: () => <DiffSkeleton />, ssr: false }
);

export function CompareView() {
  const [fromHash, setFromHash] = useState<string | null>(null);
  const [toHash, setToHash] = useState<string | null>(null);
  const [viewFormat, setViewFormat] = useState<"line-by-line" | "side-by-side">("line-by-line");

  const { data: commitData } = useUnifiedCommits({ maxCount: 100 });
  const { data: diffData, isLoading: diffLoading } = useUnifiedDiff(fromHash, toHash);

  const commits = commitData?.commits || [];

  function truncateMiddle(text: string, maxLen: number) {
    if (text.length <= maxLen) return text;
    const half = Math.floor((maxLen - 3) / 2);
    return text.slice(0, half) + "..." + text.slice(-half);
  }

  return (
    <PageLayout
      label="Diff"
      title="Compare Commits"
      description="View file changes between two commits."
      filters={
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex-1 min-w-0 space-y-1.5">
            <label className="text-sm text-muted-foreground">From (older)</label>
            <Select
              value={fromHash || ""}
              onValueChange={setFromHash}
            >
              <SelectTrigger className="h-9 w-full border-border bg-input/20 font-mono text-xs">
                <SelectValue placeholder="Select base commit" />
              </SelectTrigger>
              <SelectContent>
                {commits.map((c) => (
                  <SelectItem key={c.hash} value={c.hash} className="font-mono text-xs max-w-[var(--radix-select-trigger-width)] ">
                    <span className="truncate">{formatHash(c.hash)} {truncateMiddle(c.message, 40)}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <GitCompareArrows size={18} className="hidden shrink-0 text-muted-foreground sm:block" />

          <div className="flex-1 min-w-0 space-y-1.5">
            <label className="text-sm text-muted-foreground">To (newer)</label>
            <Select
              value={toHash || ""}
              onValueChange={setToHash}
            >
              <SelectTrigger className="h-9 w-full border-border bg-input/20 font-mono text-xs">
                <SelectValue placeholder="Select target commit" />
              </SelectTrigger>
              <SelectContent>
                {commits.map((c) => (
                  <SelectItem key={c.hash} value={c.hash} className="font-mono text-xs max-w-[var(--radix-select-trigger-width)]">
                    <span className="truncate">{formatHash(c.hash)} {truncateMiddle(c.message, 40)}</span>
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
              <SelectItem value="line-by-line">
                <AlignJustify size={14} className="mr-2 inline-block" />
                Unified
              </SelectItem>
              <SelectItem value="side-by-side">
                <Columns2 size={14} className="mr-2 inline-block" />
                Split
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      }
    >


      {/* Diff output */}
      <div>
        {!fromHash || !toHash ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-sm text-muted-foreground">
              Select two commits to compare
            </p>
          </div>
        ) : diffLoading ? (
          <DiffSkeleton />
        ) : diffData ? (
          <div className="px-6 py-6">
            <DiffViewer diff={diffData.diff} outputFormat={viewFormat} />
          </div>
        ) : null}
      </div>
    </PageLayout>
  );
}
