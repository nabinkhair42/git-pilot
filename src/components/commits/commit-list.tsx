"use client";

import { CommitListItem } from "@/components/commits/commit-list-item";
import { ConfirmationDialog } from "@/components/dialog-window/confirmation-dialog";
import { CommitListSkeleton } from "@/components/loaders/commit-list-skeleton";
import { PageLayout } from "@/components/shared/page-layout";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DEFAULT_COMMITS_PER_PAGE, RESET_MODES } from "@/config/constants";
import { useGitMutations } from "@/hooks/use-git";
import { useRepo } from "@/hooks/use-repo";
import { useUnifiedBranches, useUnifiedCommits } from "@/hooks/use-unified";
import { formatHash } from "@/lib/formatters";
import type { ResetMode } from "@/lib/git/types";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "../ui/input-group";

export function CommitList() {
  const { repoPath, mode, githubOwner, githubRepoName } = useRepo();
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
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-destructive">
          Failed to load commits: {error.message}
        </p>
      </div>
    );
  }

  return (
    <PageLayout
      label="History"
      title="Commits"
      filters={
        <div className="flex flex-col gap-2 pb-4 sm:flex-row sm:items-center sm:gap-3">
          <form onSubmit={handleSearch} className="flex flex-1 gap-2">
            <InputGroup>
              <InputGroupAddon>
                <Search />
              </InputGroupAddon>
              <InputGroupInput
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search commits..."
              />
              <InputGroupAddon align={"inline-end"}>
                <InputGroupButton variant={"secondary"}>
                  Search
                </InputGroupButton>
              </InputGroupAddon>
            </InputGroup>
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
      }
    >
      {/* Commit list */}
      <div>
        {isLoading ? (
          <CommitListSkeleton />
        ) : data?.commits.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-sm text-muted-foreground">No commits found</p>
          </div>
        ) : (
          <div>
            {data?.commits.map((commit, i) => (
              <CommitListItem
                key={commit.hash}
                hash={commit.hash}
                abbreviatedHash={commit.abbreviatedHash}
                message={commit.message}
                authorName={commit.authorName}
                date={commit.date}
                refs={commit.refs}
                href={
                  isGitHub
                    ? `/repo/commits/${commit.hash}?mode=github&owner=${encodeURIComponent(githubOwner || "")}&repo=${encodeURIComponent(githubRepoName || "")}`
                    : `/repo/commits/${commit.hash}?path=${encodeURIComponent(repoPath || "")}`
                }
                showDivider={i !== 0}
                isGitHub={isGitHub}
                onCherryPick={() => handleCherryPick(commit.hash)}
                onRevert={() => handleRevert(commit.hash)}
                onReset={(mode) => handleReset(commit.hash, mode)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <>
          
          <div>
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
    </PageLayout>
  );
}
