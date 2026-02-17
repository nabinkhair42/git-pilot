import { GitPullRequest, MoreHorizontal, Eye, GitMerge } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDistanceToNow, isValid } from "date-fns";

interface PRListItemProps {
  number: number;
  title: string;
  state: string;
  author: string;
  head: string;
  base: string;
  draft: boolean;
  createdAt: string;
  labels: string[];
  onViewDetails?: () => void;
  onMerge?: () => void;
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

export function PRListItem({
  number,
  title,
  state,
  author,
  head,
  base,
  draft,
  createdAt,
  labels,
  onViewDetails,
  onMerge,
}: PRListItemProps) {
  const dateObj = new Date(createdAt);
  const relativeDate = isValid(dateObj)
    ? formatDistanceToNow(dateObj, { addSuffix: true })
    : "";
  const badge = STATE_BADGE[state] || STATE_BADGE.open;

  return (
    <div className="group flex items-start gap-3 px-4 py-2.5 transition-colors hover:bg-muted/50">
      <div className="mt-0.5 shrink-0">
        <GitPullRequest size={16} className={STATE_COLORS[state] || "text-muted-foreground"} />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium">{title}</span>
          <Badge variant={badge.variant} className="shrink-0 px-1.5 py-0 text-2xs">
            {badge.label}
          </Badge>
          {draft ? (
            <Badge variant="outline" className="shrink-0 px-1.5 py-0 text-2xs">
              Draft
            </Badge>
          ) : null}
          {labels.map((label) => (
            <Badge key={label} variant="outline" className="shrink-0 px-1.5 py-0 text-2xs">
              {label}
            </Badge>
          ))}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-muted-foreground">
          <span>#{number}</span>
          <span>by {author}</span>
          <span className="font-mono text-2xs">
            {head} &rarr; {base}
          </span>
          {relativeDate ? <span>{relativeDate}</span> : null}
        </div>
      </div>

      <div className="shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal size={14} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                onViewDetails?.();
              }}
            >
              <Eye size={14} className="mr-2" />
              View details
            </DropdownMenuItem>
            {state === "open" ? (
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onMerge?.();
                }}
              >
                <GitMerge size={14} className="mr-2" />
                Merge PR
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
