import {
  CherryIcon,
  Copy,
  MoreHorizontal,
  RotateCcw,
  Undo2,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { RESET_MODES } from "@/config/constants";
import { formatRelativeDate } from "@/lib/formatters";
import type { ResetMode } from "@/types/git";

interface CommitListItemProps {
  hash: string;
  abbreviatedHash: string;
  message: string;
  authorName: string;
  date: string;
  refs?: string;
  href: string;
  showDivider?: boolean;
  onCherryPick?: () => void;
  onRevert?: () => void;
  onReset?: (mode: ResetMode) => void;
}

export function CommitListItem({
  hash,
  abbreviatedHash,
  message,
  authorName,
  date,
  refs,
  href,
  showDivider,
  onCherryPick,
  onRevert,
  onReset,
}: CommitListItemProps) {
  return (
    <div
      className={`group flex flex-col gap-0.5 px-4 transition-colors hover:bg-muted sm:flex-row sm:items-start sm:gap-4 sm:px-6 py-2 sm:py-3 ${
        showDivider ? "border-t border-dashed border-border" : ""
      }`}
    >
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard.writeText(hash);
              toast.success("Hash copied");
            }}
            className="flex shrink-0 items-center gap-1 rounded px-1 py-0.5 font-mono text-2xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:mt-0.5 sm:text-xs"
          >
            {abbreviatedHash}
            <Copy
              size={10}
              className="opacity-0 transition-opacity group-hover:opacity-60"
            />
          </button>
        </TooltipTrigger>
        <TooltipContent side="left" className="text-xs">
          Click to copy full hash
        </TooltipContent>
      </Tooltip>

      <div className="min-w-0 flex-1">
        <Link
          href={href}
          className="block truncate text-xs font-medium text-foreground transition-colors hover:text-foreground/80 sm:text-sm"
        >
          {message}
        </Link>
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-2xs text-muted-foreground sm:mt-1 sm:gap-2 sm:text-xs">
          <span>{authorName}</span>
          <span>&middot;</span>
          <span>{formatRelativeDate(date)}</span>
          {refs ? (
            <>
              <span>&middot;</span>
              {refs.split(",").map((ref) => (
                <Badge
                  key={ref.trim()}
                  variant="outline"
                  className="border-border px-1.5 py-0 text-2.5 font-mono"
                >
                  {ref.trim()}
                </Badge>
              ))}
            </>
          ) : null}
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontal size={14} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={onCherryPick}>
            <CherryIcon size={14} className="mr-2" />
            Cherry-pick
          </DropdownMenuItem>
          <DropdownMenuItem onClick={onRevert}>
            <Undo2 size={14} className="mr-2" />
            Revert
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => onReset?.("hard")}
            className="text-destructive focus:text-destructive"
          >
            <RotateCcw size={14} className="mr-2" />
            {RESET_MODES.hard.label} reset to here
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => {
              navigator.clipboard.writeText(hash);
              toast.success("Hash copied");
            }}
          >
            Copy full hash
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
