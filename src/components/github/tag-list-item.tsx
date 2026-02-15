import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatHash, formatRelativeDate } from "@/lib/formatters";
import { BookMarked, MoreHorizontal, Tag } from "lucide-react";
import { toast } from "sonner";

interface TagListItemProps {
  name: string;
  hash: string;
  message?: string;
  date?: string;
  tagger?: string;
  isAnnotated?: boolean;
  showDivider?: boolean;
}

export function TagListItem({
  name,
  hash,
  message,
  date,
  tagger,
  isAnnotated,
  showDivider,
}: TagListItemProps) {
  return (
    <div
      className={`group flex flex-col gap-1.5 px-4 transition-colors hover:bg-muted sm:flex-row sm:items-center sm:gap-4 sm:px-6 py-2 sm:py-3  ${
        showDivider ? "border-t border-dashed border-border" : ""
      }`}
    >
      <div className="flex size-5 shrink-0 items-center justify-center">
        {isAnnotated ? (
          <BookMarked size={14} className="text-git-modified" />
        ) : (
          <Tag size={14} className="text-muted-foreground" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-medium text-foreground">
            {name}
          </span>
          {isAnnotated ? (
            <Badge
              variant="outline"
              className="border-git-modified/30 px-1.5 py-0 text-2.5 text-git-modified"
            >
              annotated
            </Badge>
          ) : null}
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
          <span>{formatHash(hash)}</span>
          {message ? (
            <>
              <span>&middot;</span>
              <span className="truncate">{message}</span>
            </>
          ) : null}
          {date ? (
            <>
              <span>&middot;</span>
              <span>{formatRelativeDate(date)}</span>
            </>
          ) : null}
          {tagger ? (
            <>
              <span>&middot;</span>
              <span>{tagger}</span>
            </>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            navigator.clipboard.writeText(name);
            toast.success("Tag name copied");
          }}
          className="border-border text-xs opacity-0 transition-all group-hover:opacity-100 hover:bg-accent"
        >
          Copy
        </Button>
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
              onClick={() => {
                navigator.clipboard.writeText(hash);
                toast.success("Hash copied");
              }}
            >
              Copy hash
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
