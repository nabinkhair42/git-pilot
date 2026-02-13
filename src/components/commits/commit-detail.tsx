"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, FileText, Plus, Minus } from "lucide-react";
import { useUnifiedCommitDetail } from "@/hooks/use-unified";
import { useRepo } from "@/hooks/use-repo";
import { formatDate, formatHash, formatDiffStats } from "@/lib/formatters";
import { FILE_STATUS_LABELS, FILE_STATUS_COLORS } from "@/config/constants";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DiffViewer } from "@/components/diff/diff-viewer";

interface CommitDetailProps {
  hash: string;
}

export function CommitDetail({ hash }: CommitDetailProps) {
  const { repoPath, mode, githubOwner, githubRepoName } = useRepo();
  const isGitHub = mode === "github";
  const { data: commit, isLoading, error } = useUnifiedCommitDetail(hash);
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="rail-bounded">
        <div className="space-y-6 px-6 py-8">
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
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
    <>
      {/* Header */}
      <div className="rail-bounded px-6">
        <div className="pb-6 pt-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const backUrl = isGitHub
                ? `/repo/commits?mode=github&owner=${encodeURIComponent(githubOwner || "")}&repo=${encodeURIComponent(githubRepoName || "")}`
                : `/repo/commits?path=${encodeURIComponent(repoPath || "")}`;
              router.push(backUrl);
            }}
            className="mb-4 -ml-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft size={14} className="mr-1" />
            Back to commits
          </Button>

          <h2 className="text-xl font-bold tracking-tight">{commit.message}</h2>
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
            <code className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-xs">
              {commit.abbreviatedHash}
            </code>
          </div>

          <div className="mt-3 flex items-center gap-3 text-xs">
            <span className="text-muted-foreground">
              {commit.stats.changed} file{commit.stats.changed !== 1 ? "s" : ""} changed
            </span>
            {commit.stats.insertions > 0 && (
              <span className="flex items-center gap-1 text-green-400">
                <Plus size={12} />
                {commit.stats.insertions}
              </span>
            )}
            {commit.stats.deletions > 0 && (
              <span className="flex items-center gap-1 text-red-400">
                <Minus size={12} />
                {commit.stats.deletions}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="section-divider" aria-hidden="true" />

      {/* File list */}
      <div className="rail-bounded border-t border-border">
        <div className="px-6 pb-3 pt-6">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Changed Files
          </p>
        </div>
        <div>
          {commit.files.map((file, i) => (
            <div
              key={file.file}
              className={`flex items-center gap-3 px-6 py-2.5 transition-colors hover:bg-white/[0.02] ${
                i !== 0 ? "border-t border-dashed border-border" : ""
              }`}
            >
              <Badge
                variant="outline"
                className={`shrink-0 border-white/[0.08] px-1.5 py-0 text-[10px] font-mono ${
                  FILE_STATUS_COLORS[file.status] || "text-muted-foreground"
                }`}
              >
                {FILE_STATUS_LABELS[file.status] || file.status}
              </Badge>
              <FileText size={14} className="shrink-0 text-muted-foreground" />
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

      <div className="section-divider" aria-hidden="true" />

      {/* Diff */}
      <div className="rail-bounded border-t border-border">
        <div className="px-6 pb-3 pt-6">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Diff
          </p>
        </div>
        <div className="overflow-x-auto px-6 pb-8">
          <DiffViewer diff={commit.diff} />
        </div>
      </div>
    </>
  );
}
