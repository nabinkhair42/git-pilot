import {
  Archive,
  Play,
  ArrowUpFromLine,
  Trash2,
  MoreHorizontal,
} from "lucide-react";
import { formatRelativeDate, formatHash } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface StashListItemProps {
  index: number;
  hash: string;
  message: string;
  date?: string;
  showDivider?: boolean;
  popLoading?: boolean;
  applyLoading?: boolean;
  actionsDisabled?: boolean;
  onPop?: () => void;
  onApply?: () => void;
  onDrop?: () => void;
}

function formatStashMessage(message: string) {
  return (
    message.replace(/^WIP on .+?: [a-f0-9]+ /, "").replace(/^On .+?: /, "") ||
    "Untitled stash"
  );
}

export function StashListItem({
  index,
  hash,
  message,
  date,
  showDivider,
  popLoading,
  applyLoading,
  actionsDisabled,
  onPop,
  onApply,
  onDrop,
}: StashListItemProps) {
  return (
    <div
      className={`group flex flex-col gap-1.5 px-4 transition-colors hover:bg-muted sm:flex-row sm:items-center sm:gap-4 sm:px-6 py-2 sm:py-3  ${
        showDivider ? "border-t border-dashed border-border" : ""
      }`}
    >
      <div className="flex size-5 shrink-0 items-center justify-center">
        <Archive size={14} className="text-muted-foreground" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs text-muted-foreground/60">
            stash@{"{"}
            {index}
            {"}"}
          </span>
          <span className="truncate text-sm font-medium text-foreground">
            {formatStashMessage(message)}
          </span>
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
          <span>{formatHash(hash)}</span>
          {date && (
            <>
              <span>&middot;</span>
              <span>{formatRelativeDate(date)}</span>
            </>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onPop}
          isLoading={popLoading}
          disabled={actionsDisabled}
          className="border-border text-xs transition-colors hover:bg-accent"
        >
          <ArrowUpFromLine size={12} className="mr-1" />
          Pop
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onApply}
          isLoading={applyLoading}
          disabled={actionsDisabled}
          className="border-border text-xs transition-colors hover:bg-accent"
        >
          <Play size={12} className="mr-1" />
          Apply
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
            >
              <MoreHorizontal size={14} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={onDrop}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 size={14} className="mr-2" />
              Drop
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
