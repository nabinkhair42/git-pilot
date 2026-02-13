"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  RotateCcw,
  CherryIcon,
  Undo2,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import { useGitMutations } from "@/hooks/use-git";
import { useRepo } from "@/hooks/use-repo";
import { useUnifiedCommits, useUnifiedBranches } from "@/hooks/use-unified";
import { formatRelativeDate, formatHash } from "@/lib/formatters";
import { DEFAULT_COMMITS_PER_PAGE, RESET_MODES } from "@/config/constants";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { CommitListSkeleton } from "@/components/loaders/commit-list-skeleton";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import type { ResetMode } from "@/lib/git/types";

export function CommitList() {
  const { repoPath, mode, githubOwner, githubRepoName } = useRepo();
  const searchParams = useSearchParams();
  const isGitHub = mode === "github";

  const [page, setPage] = useState(0);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [branch, setBranch] = useState<string | undefined>(undefined);

  const { data, isLoading, error } = useUnifiedCommits({
    branch,
    maxCount: DEFAULT_COMMITS_PER_PAGE,
    skip: isGitHub ? undefined : page * DEFAULT_COMMITS_PER_PAGE,
    search: isGitHub ? undefined : search || undefined,
  });

  const { data: branchData } = useUnifiedBranches();
  const mutations = useGitMutations();

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    confirmLabel: string;
    variant: "default" | "destructive";
    typedConfirmation?: string;
    action: () => Promise<void>;
  }>({
    open: false,
    title: "",
    description: "",
    confirmLabel: "",
    variant: "default",
    action: async () => {},
  });

  const [operationLoading, setOperationLoading] = useState(false);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput);
    setPage(0);
  }

  const showConfirm = useCallback(
    (opts: Omit<typeof confirmDialog, "open">) => {
      setConfirmDialog({ ...opts, open: true });
    },
    [],
  );

  async function executeWithToast(
    action: () => Promise<{ success: boolean; message: string }>,
    successMsg?: string,
  ) {
    setOperationLoading(true);
    try {
      const result = await action();
      if (result.success) {
        toast.success(successMsg || result.message);
      } else {
        toast.error(result.message);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Operation failed");
    } finally {
      setOperationLoading(false);
      setConfirmDialog((prev) => ({ ...prev, open: false }));
    }
  }

  function handleReset(hash: string, mode: ResetMode) {
    const config = RESET_MODES[mode];
    const isCritical = config.tier === "critical";

    showConfirm({
      title: `${config.label} Reset`,
      description: `${config.description}. This will reset HEAD to ${formatHash(hash)}.${
        isCritical
          ? " This action is irreversible and will discard all uncommitted changes."
          : ""
      }`,
      confirmLabel: `Reset (${mode})`,
      variant: "destructive",
      typedConfirmation: isCritical ? formatHash(hash) : undefined,
      action: () => executeWithToast(() => mutations.reset(hash, mode)),
    });
  }

  function handleCherryPick(hash: string) {
    showConfirm({
      title: "Cherry-pick Commit",
      description: `Apply commit ${formatHash(hash)} onto the current branch.`,
      confirmLabel: "Cherry-pick",
      variant: "default",
      action: () => executeWithToast(() => mutations.cherryPick([hash])),
    });
  }

  function handleRevert(hash: string) {
    showConfirm({
      title: "Revert Commit",
      description: `Create a new commit that undoes the changes from ${formatHash(hash)}.`,
      confirmLabel: "Revert",
      variant: "default",
      action: () => executeWithToast(() => mutations.revert([hash])),
    });
  }

  const totalPages = data
    ? Math.ceil(data.total / DEFAULT_COMMITS_PER_PAGE)
    : 0;

  if (error) {
    return (
      <div className="rail-bounded flex items-center justify-center py-20">
        <p className="text-sm text-destructive">
          Failed to load commits: {error.message}
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Search and filters */}
      <div className="rail-bounded px-4 sm:px-6">
        <div className="flex flex-col gap-2 pb-3 pt-4 sm:flex-row sm:items-center sm:gap-3 sm:pb-4 sm:pt-6">
          <form onSubmit={handleSearch} className="flex flex-1 gap-2">
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search commits..."
              className="h-9 flex-1 border-border bg-input/20 text-sm placeholder:text-muted-foreground/50 focus:border-primary/40 focus:ring-1 focus:ring-primary/20"
            />
            <Button
              type="submit"
              variant="outline"
              size="sm"
              className="border-border transition-colors hover:bg-accent"
            >
              Search
            </Button>
          </form>

          {branchData && (
            <Select
              value={branch || "__all__"}
              onValueChange={(v) => {
                setBranch(v === "__all__" ? undefined : v);
                setPage(0);
              }}
            >
              <SelectTrigger className="h-9 w-full border-border bg-input/20 text-sm sm:w-auto sm:min-w-35">
                <SelectValue placeholder="All branches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All branches</SelectItem>
                {branchData.branches.map((b) => (
                  <SelectItem key={b.name} value={b.name}>
                    {b.name} {b.current ? "(current)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      <div className="section-divider" aria-hidden="true" />

      {/* Commit list */}
      <div className="rail-bounded border-t border-border">
        {isLoading ? (
          <CommitListSkeleton />
        ) : data?.commits.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-sm text-muted-foreground">No commits found</p>
          </div>
        ) : (
          <div>
            {data?.commits.map((commit, i) => (
              <div
                key={commit.hash}
                className={`group flex flex-col gap-0.5 px-4 transition-colors hover:bg-muted sm:flex-row sm:items-start sm:gap-4 sm:px-6 py-2 sm:py-3 ${
                  i !== 0 ? "border-t border-dashed border-border" : ""
                }`}
              >
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(commit.hash);
                        toast.success("Hash copied");
                      }}
                      className="flex shrink-0 items-center gap-1 rounded px-1 py-0.5 font-mono text-[11px] text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:mt-0.5 sm:text-xs"
                    >
                      {commit.abbreviatedHash}
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
                    href={
                      isGitHub
                        ? `/repo/commits/${commit.hash}?mode=github&owner=${encodeURIComponent(githubOwner || "")}&repo=${encodeURIComponent(githubRepoName || "")}`
                        : `/repo/commits/${commit.hash}?path=${encodeURIComponent(repoPath || "")}`
                    }
                    className="block truncate text-[13px] font-medium text-foreground transition-colors hover:text-foreground/80 sm:text-sm"
                  >
                    {commit.message}
                  </Link>
                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground sm:mt-1 sm:gap-2 sm:text-xs">
                    <span>{commit.authorName}</span>
                    <span>&middot;</span>
                    <span>{formatRelativeDate(commit.date)}</span>
                    {commit.refs && (
                      <>
                        <span>&middot;</span>
                        {commit.refs.split(",").map((ref) => (
                          <Badge
                            key={ref.trim()}
                            variant="outline"
                            className="border-border px-1.5 py-0 text-[10px] font-mono"
                          >
                            {ref.trim()}
                          </Badge>
                        ))}
                      </>
                    )}
                  </div>
                </div>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
                    >
                      <MoreHorizontal size={14} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {!isGitHub && (
                      <>
                        <DropdownMenuItem
                          onClick={() => handleCherryPick(commit.hash)}
                        >
                          <CherryIcon size={14} className="mr-2" />
                          Cherry-pick
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleRevert(commit.hash)}
                        >
                          <Undo2 size={14} className="mr-2" />
                          Revert
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>
                            <RotateCcw size={14} className="mr-2" />
                            Reset to here
                          </DropdownMenuSubTrigger>
                          <DropdownMenuSubContent>
                            {(Object.keys(RESET_MODES) as ResetMode[]).map(
                              (resetMode) => (
                                <DropdownMenuItem
                                  key={resetMode}
                                  onClick={() =>
                                    handleReset(commit.hash, resetMode)
                                  }
                                  className={
                                    resetMode === "hard"
                                      ? "text-destructive focus:text-destructive"
                                      : ""
                                  }
                                >
                                  {RESET_MODES[resetMode].label}
                                  <span className="ml-auto text-[10px] text-muted-foreground">
                                    {RESET_MODES[resetMode].description}
                                  </span>
                                </DropdownMenuItem>
                              ),
                            )}
                          </DropdownMenuSubContent>
                        </DropdownMenuSub>
                        <DropdownMenuSeparator />
                      </>
                    )}
                    <DropdownMenuItem
                      onClick={() => {
                        navigator.clipboard.writeText(commit.hash);
                        toast.success("Hash copied");
                      }}
                    >
                      Copy full hash
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <>
          <div className="section-divider" aria-hidden="true" />
          <div className="rail-bounded border-t border-border">
            <div className="flex items-center justify-between px-6 py-4">
              <span className="text-xs text-muted-foreground">
                Page {page + 1} of {totalPages} ({data?.total} commits)
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="border-border transition-colors hover:bg-accent"
                >
                  <ChevronLeft size={14} />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page + 1 >= totalPages}
                  className="border-border transition-colors hover:bg-accent"
                >
                  Next
                  <ChevronRight size={14} />
                </Button>
              </div>
            </div>
          </div>
        </>
      )}

      <ConfirmationDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}
        title={confirmDialog.title}
        description={confirmDialog.description}
        confirmLabel={confirmDialog.confirmLabel}
        variant={confirmDialog.variant}
        typedConfirmation={confirmDialog.typedConfirmation}
        onConfirm={confirmDialog.action}
        loading={operationLoading}
      />
    </>
  );
}
