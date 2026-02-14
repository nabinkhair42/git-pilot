"use client";

import { CommitDetailSkeleton } from "@/components/loaders/commit-detail-skeleton";
import { DiffSkeleton } from "@/components/loaders/diff-skeleton";
import { Badge } from "@/components/ui/badge";
import { FILE_STATUS_COLORS, FILE_STATUS_LABELS } from "@/config/constants";
import { useUnifiedCommitDetail } from "@/hooks/use-unified";
import { formatDate, formatDiffStats } from "@/lib/formatters";
import { FileText, Minus, Plus } from "lucide-react";
import dynamic from "next/dynamic";

// bundle-dynamic-imports: diff2html is ~100KB, only needed when viewing diffs
const DiffViewer = dynamic(
  () => import("@/components/diff/diff-viewer"),
  { loading: () => <DiffSkeleton />, ssr: false }
);

interface CommitDetailProps {
  hash: string;
}

export function CommitDetail({ hash }: CommitDetailProps) {
  const { data: commit, isLoading, error } = useUnifiedCommitDetail(hash);

  if (isLoading) {
    return <CommitDetailSkeleton />;
  }

  if (error || !commit) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-destructive">
          {error?.message || "Failed to load commit"}
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Pinned header */}
      <div className="rail-bounded px-4 sm:px-6">
        <div className="py-4">
          <h2 className="text-xl font-bold tracking-tight truncate max-w-md">
            {commit.message}
          </h2>
          {commit.body && (
            <p className="mt-2 whitespace-pre-wrap text-sm text-muted-foreground">
              {commit.body}
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
            <span>{commit.authorName}</span>
            <span>&middot;</span>
            <span>{formatDate(commit.date)}</span>
            <span>&middot;</span>
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
              {commit.abbreviatedHash}
            </code>
          </div>

          <div className="mt-3 flex items-center gap-3 text-xs">
            <span className="text-muted-foreground">
              {commit.stats.changed} file{commit.stats.changed !== 1 ? "s" : ""}{" "}
              changed
            </span>
            {commit.stats.insertions > 0 ? (
              <span className="flex items-center gap-1 text-git-added">
                <Plus size={12} />
                {commit.stats.insertions}
              </span>
            ) : null}
            {commit.stats.deletions > 0 ? (
              <span className="flex items-center gap-1 text-git-deleted">
                <Minus size={12} />
                {commit.stats.deletions}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="min-h-0 flex-1 overflow-y-auto">


        {/* File list */}
        <div className="rail-bounded">
          <div className="px-6 pb-3 pt-6">
            <p className="text-xs font-medium text-muted-foreground">
              Changed Files
            </p>
          </div>
          <div>
            {commit.files.map((file, i) => (
              <div
                key={file.file}
                className={`flex items-center gap-3 px-6 py-2.5 transition-colors hover:bg-muted ${
                  i !== 0 ? "border-t border-dashed border-border" : ""
                }`}
              >
                <Badge
                  variant="outline"
                  className={`shrink-0 border-border px-1.5 py-0 text-2.5 font-mono ${
                    FILE_STATUS_COLORS[file.status] || "text-muted-foreground"
                  }`}
                >
                  {FILE_STATUS_LABELS[file.status] || file.status}
                </Badge>
                <FileText
                  size={14}
                  className="shrink-0 text-muted-foreground"
                />
                <span className="min-w-0 flex-1 truncate font-mono text-sm">
                  {file.file}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatDiffStats(file.insertions, file.deletions)}
                </span>
              </div>
            ))}
          </div>
        </div>



        {/* Diff */}
        <div className="rail-bounded">
          <div className="px-6 pb-3 pt-6">
            <p className="text-xs font-medium text-muted-foreground">Diff</p>
          </div>
          <div className="overflow-x-auto px-6 pb-8">
            <DiffViewer diff={commit.diff} />
          </div>
        </div>
      </div>
    </div>
  );
}
