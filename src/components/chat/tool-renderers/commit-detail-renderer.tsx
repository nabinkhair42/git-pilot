"use client";

import dynamic from "next/dynamic";
import { Badge } from "@/components/ui/badge";
import { formatRelativeDate, formatDiffStats } from "@/lib/formatters";
import { FileText } from "lucide-react";
import type { ToolRendererProps } from "./registry";

const DiffViewer = dynamic(() => import("@/components/diff/diff-viewer"), {
  ssr: false,
  loading: () => <div className="py-4 text-center text-xs text-muted-foreground">Loading diff...</div>,
});

interface CommitDetailOutput {
  hash: string;
  fullHash: string;
  message: string;
  body?: string;
  author: string;
  date: string;
  parentHashes: string[];
  stats: { filesChanged: number; insertions: number; deletions: number };
  files: { file: string; status: string; insertions: number; deletions: number }[];
  diff: string;
}

export function CommitDetailRenderer({ output, onAction }: ToolRendererProps) {
  const data = output as CommitDetailOutput;
  if (!data?.hash) return null;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="rounded-md border border-border bg-muted/30 p-3 space-y-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-medium">{data.message}</p>
            {data.body && <p className="mt-1 text-xs text-muted-foreground whitespace-pre-wrap">{data.body}</p>}
          </div>
          <Badge variant="outline" className="shrink-0 font-mono text-2xs">
            {data.hash}
          </Badge>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>{data.author}</span>
          <span>&middot;</span>
          <span>{formatRelativeDate(data.date)}</span>
          <span>&middot;</span>
          <span>
            {data.stats.filesChanged} file{data.stats.filesChanged !== 1 ? "s" : ""},{" "}
            {formatDiffStats(data.stats.insertions, data.stats.deletions)}
          </span>
        </div>
      </div>

      {/* Files changed */}
      {data.files.length > 0 && (
        <div className="rounded-md border border-border overflow-hidden">
          <div className="border-b border-border bg-muted/30 px-3 py-1.5 text-xs text-muted-foreground">
            Files changed
          </div>
          <div className="divide-y divide-border">
            {data.files.map((f) => (
              <button
                key={f.file}
                type="button"
                className="flex w-full items-center gap-2 px-3 py-1.5 text-xs hover:bg-muted/50 transition-colors text-left"
                onClick={() => onAction(`Show me the content of ${f.file}`)}
              >
                <FileText className="size-3 shrink-0 text-muted-foreground" />
                <span className="font-mono truncate flex-1">{f.file}</span>
                <span className="shrink-0 text-muted-foreground">
                  {formatDiffStats(f.insertions, f.deletions)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Diff */}
      {data.diff && (
        <div className="rounded-md border border-border overflow-hidden">
          <DiffViewer diff={data.diff} />
        </div>
      )}
    </div>
  );
}
