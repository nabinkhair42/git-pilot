import { GitBranch, Check, Trash2, MoreHorizontal } from "lucide-react";
import { formatHash } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface BranchListItemProps {
  name: string;
  commit: string;
  current?: boolean;
  showDivider?: boolean;
  onDelete?: () => void;
}

export function BranchListItem({
  name,
  commit,
  current,
  showDivider,
  onDelete,
}: BranchListItemProps) {
  return (
    <div
      className={`group flex flex-col gap-1.5 px-4 transition-colors cursor-pointer hover:bg-muted sm:flex-row sm:items-center sm:gap-4 sm:px-6 py-2 sm:py-3  ${
        showDivider ? "border-t border-dashed border-border" : ""
      }`}
    >
      <div className="flex size-5 shrink-0 items-center justify-center">
        {current ? (
          <Check size={16} className="text-git-added" />
        ) : (
          <GitBranch size={14} className="text-muted-foreground" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-mono text-sm font-medium text-foreground">
            {name}
          </span>
          {current ? (
            <Badge
              variant="outline"
              className="border-git-added/30 px-1.5 py-0 text-2.5 text-git-added"
            >
              default
            </Badge>
          ) : null}
        </div>
        <span className="text-xs text-muted-foreground">
          {formatHash(commit)}
        </span>
      </div>

      {!current ? (
        <div className="flex shrink-0 items-center gap-2">
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
                  onDelete?.();
                }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 size={14} className="mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ) : null}
    </div>
  );
}
