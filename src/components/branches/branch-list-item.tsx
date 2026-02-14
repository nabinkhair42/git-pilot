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
  isRemote?: boolean;
  isGitHub?: boolean;
  showDivider?: boolean;
  checkoutLoading?: boolean;
  checkoutDisabled?: boolean;
  onCheckout?: () => void;
  onDelete?: (force: boolean) => void;
}

export function BranchListItem({
  name,
  commit,
  current,
  isRemote,
  isGitHub,
  showDivider,
  checkoutLoading,
  checkoutDisabled,
  onCheckout,
  onDelete,
}: BranchListItemProps) {
  const showActions = !isGitHub && (!current || isRemote);

  return (
    <div
      className={`group flex flex-col gap-1.5 px-4 transition-colors cursor-pointer hover:bg-muted sm:flex-row sm:items-center sm:gap-4 sm:px-6 py-2 sm:py-3  ${
        showDivider ? "border-t border-dashed border-border" : ""
      }`}
    >
      <div className="flex size-5 shrink-0 items-center justify-center">
        {current && !isRemote ? (
          <Check size={16} className="text-git-added" />
        ) : (
          <GitBranch
            size={14}
            className={
              isRemote ? "text-muted-foreground/50" : "text-muted-foreground"
            }
          />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span
            className={`font-mono text-sm ${
              isRemote ? "text-foreground/70" : "font-medium text-foreground"
            }`}
          >
            {name}
          </span>
          {current && !isRemote && (
            <Badge
              variant="outline"
              className="border-git-added/30 px-1.5 py-0 text-[10px] text-git-added"
            >
              current
            </Badge>
          )}
          {isRemote && (
            <Badge
              variant="outline"
              className="border-git-info/30 px-1.5 py-0 text-[10px] text-git-info"
            >
              remote
            </Badge>
          )}
        </div>
        <span className="text-xs text-muted-foreground">
          {formatHash(commit)}
        </span>
      </div>

      {showActions && (
        <div className="flex shrink-0 items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onCheckout}
            isLoading={checkoutLoading}
            disabled={checkoutDisabled}
            className="border-border text-xs transition-colors hover:bg-accent"
          >
            {isRemote ? "Checkout" : "Switch"}
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
                onClick={() => onDelete?.(false)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 size={14} className="mr-2" />
                {isRemote ? "Delete Remote" : "Delete"}
              </DropdownMenuItem>
              {!isRemote && (
                <DropdownMenuItem
                  onClick={() => onDelete?.(true)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 size={14} className="mr-2" />
                  Force Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
}
