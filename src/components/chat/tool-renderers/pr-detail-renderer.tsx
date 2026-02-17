import {
  GitPullRequest,
  GitCommit,
  FileText,
  Plus,
  Minus,
  ExternalLink,
  GitMerge,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Clock,
  Ban,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow, isValid } from "date-fns";
import type { ToolRendererProps } from "./registry";

interface Review {
  user: string;
  avatarUrl: string;
  state: string;
  submittedAt: string;
}

interface PRFile {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
}

interface PRDetailOutput {
  number: number;
  title: string;
  body: string;
  state: string;
  merged: boolean;
  mergeable: boolean | null;
  draft: boolean;
  author: string;
  authorAvatarUrl: string;
  createdAt: string;
  updatedAt: string;
  mergedAt: string | null;
  mergedBy: string | null;
  commits: number;
  additions: number;
  deletions: number;
  changedFiles: number;
  head: string;
  base: string;
  labels: string[];
  reviews: Review[];
  files: PRFile[];
  url: string;
  error?: string;
}

const STATE_COLORS: Record<string, string> = {
  open: "text-green-500",
  merged: "text-purple-500",
  closed: "text-red-500",
};

const STATE_BADGE: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
  open: { variant: "default", label: "Open" },
  merged: { variant: "secondary", label: "Merged" },
  closed: { variant: "destructive", label: "Closed" },
};

const REVIEW_ICONS: Record<string, typeof CheckCircle2> = {
  APPROVED: CheckCircle2,
  CHANGES_REQUESTED: XCircle,
  COMMENTED: MessageSquare,
  PENDING: Clock,
  DISMISSED: Ban,
};

const REVIEW_COLORS: Record<string, string> = {
  APPROVED: "text-green-500",
  CHANGES_REQUESTED: "text-red-500",
  COMMENTED: "text-blue-500",
  PENDING: "text-yellow-500",
  DISMISSED: "text-muted-foreground",
};

const REVIEW_LABELS: Record<string, string> = {
  APPROVED: "Approved",
  CHANGES_REQUESTED: "Changes requested",
  COMMENTED: "Commented",
  PENDING: "Pending",
  DISMISSED: "Dismissed",
};

export function PRDetailRenderer({ output, onAction }: ToolRendererProps) {
  const data = output as PRDetailOutput;
  if (data?.error) {
    return (
      <div className="flex items-start gap-2.5 rounded-md border border-red-500/30 bg-red-500/5 p-3">
        <XCircle className="mt-0.5 size-4 shrink-0 text-red-600" />
        <p className="text-sm">{data.error}</p>
      </div>
    );
  }
  if (!data?.number) return null;

  const badge = STATE_BADGE[data.state] || STATE_BADGE.open;
  const dateObj = new Date(data.createdAt);
  const relativeDate = isValid(dateObj)
    ? formatDistanceToNow(dateObj, { addSuffix: true })
    : "";

  // Deduplicate reviews: keep last review per user
  const reviewMap = new Map<string, Review>();
  for (const review of data.reviews) {
    reviewMap.set(review.user, review);
  }
  const deduplicatedReviews = Array.from(reviewMap.values());

  return (
    <div className="rounded-md border border-border overflow-hidden">
      {/* Header */}
      <div className="border-b border-border bg-muted/30 px-4 py-3">
        <div className="flex items-start gap-2">
          <GitPullRequest size={18} className={`mt-0.5 shrink-0 ${STATE_COLORS[data.state] || ""}`} />
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold">{data.title}</h3>
            <div className="mt-1 flex flex-wrap items-center gap-1.5">
              <Badge variant={badge.variant} className="px-1.5 py-0 text-[10px]">
                {badge.label}
              </Badge>
              {data.draft ? (
                <Badge variant="outline" className="px-1.5 py-0 text-[10px]">
                  Draft
                </Badge>
              ) : null}
              <span className="text-xs text-muted-foreground">#{data.number}</span>
              {data.labels.map((label) => (
                <Badge key={label} variant="outline" className="px-1.5 py-0 text-[10px]">
                  {label}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Metadata */}
      <div className="border-b border-border px-4 py-2.5 text-xs text-muted-foreground">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
          <span className="flex items-center gap-1">
            {data.authorAvatarUrl ? (
              <img src={data.authorAvatarUrl} alt={data.author} className="size-4 rounded-full" />
            ) : null}
            @{data.author}
          </span>
          {relativeDate ? <span>{relativeDate}</span> : null}
          <span className="flex items-center gap-1">
            <GitCommit size={12} />
            {data.commits} commit{data.commits !== 1 ? "s" : ""}
          </span>
          <span className="flex items-center gap-1">
            <FileText size={12} />
            {data.changedFiles} file{data.changedFiles !== 1 ? "s" : ""}
          </span>
          <span className="flex items-center gap-1">
            <Plus size={12} className="text-green-500" />
            {data.additions}
            <Minus size={12} className="ml-1 text-red-500" />
            {data.deletions}
          </span>
          <span className="font-mono text-[11px]">
            {data.head} &rarr; {data.base}
          </span>
        </div>
        {data.mergedBy ? (
          <div className="mt-1 text-xs">
            Merged by @{data.mergedBy}
          </div>
        ) : null}
      </div>

      {/* Reviews */}
      {deduplicatedReviews.length > 0 ? (
        <div className="border-b border-border px-4 py-2.5">
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">Reviews</p>
          <div className="flex flex-wrap gap-2">
            {deduplicatedReviews.map((review) => {
              const Icon = REVIEW_ICONS[review.state] || MessageSquare;
              const color = REVIEW_COLORS[review.state] || "text-muted-foreground";
              const label = REVIEW_LABELS[review.state] || review.state;
              return (
                <div key={review.user} className="flex items-center gap-1.5 text-xs">
                  {review.avatarUrl ? (
                    <img src={review.avatarUrl} alt={review.user} className="size-4 rounded-full" />
                  ) : null}
                  <span>{review.user}</span>
                  <Icon size={12} className={color} />
                  <span className={`${color} text-[11px]`}>{label}</span>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Files changed */}
      {data.files.length > 0 ? (
        <div className="border-b border-border px-4 py-2.5">
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">
            Files changed ({data.files.length})
          </p>
          <div className="max-h-40 overflow-y-auto space-y-0.5">
            {data.files.map((file) => (
              <button
                key={file.filename}
                type="button"
                className="flex w-full items-center gap-2 rounded px-1.5 py-0.5 text-left text-xs transition-colors hover:bg-muted/50"
                onClick={() => onAction(`Show me the file ${file.filename}`)}
              >
                <FileText size={12} className="shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate font-mono">{file.filename}</span>
                <span className="shrink-0 text-green-500">+{file.additions}</span>
                <span className="shrink-0 text-red-500">-{file.deletions}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {/* Body/Description */}
      {data.body ? (
        <div className="border-b border-border px-4 py-2.5">
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">Description</p>
          <div className="max-h-48 overflow-y-auto text-xs text-muted-foreground whitespace-pre-wrap">
            {data.body}
          </div>
        </div>
      ) : null}

      {/* Actions */}
      <div className="flex items-center gap-2 px-4 py-2.5">
        {data.state === "open" ? (
          <Button
            size="sm"
            variant="default"
            className="gap-1.5"
            onClick={() => onAction(`Merge pull request #${data.number}`)}
          >
            <GitMerge size={14} />
            Merge PR
          </Button>
        ) : null}
        <a
          href={data.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          <ExternalLink size={12} />
          View on GitHub
        </a>
      </div>
    </div>
  );
}
