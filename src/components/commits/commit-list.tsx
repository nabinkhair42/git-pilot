"use client";

import { CommitListItem } from "@/components/commits/commit-list-item";
import { ConfirmationDialog } from "@/components/dialog-window/confirmation-dialog";
import { CommitListSkeleton } from "@/components/loaders/commit-list-skeleton";
import { PageLayout } from "@/components/shared/page-layout";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RESET_MODES } from "@/config/constants";
import { useGitHubMutations } from "@/hooks/use-github";
import { useRepo } from "@/hooks/use-repo";
import { useUnifiedBranches, useUnifiedCommits } from "@/hooks/use-unified";
import { formatHash } from "@/lib/formatters";
import type { ResetMode } from "@/types/git";
import { Search } from "lucide-react";
import { useCallback, useState } from "react";
import { toast } from "sonner";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "../ui/input-group";

export function CommitList() {
  const { githubOwner, githubRepoName } = useRepo();

  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [branch, setBranch] = useState<string | undefined>(undefined);

  const { data, isLoading, error } = useUnifiedCommits({
    branch,
  });

  const { data: branchData } = useUnifiedBranches();
  const ghMutations = useGitHubMutations();

  // Resolve the target branch for GitHub operations
  const defaultBranch = branchData?.branches.find((b) => b.current)?.name;
  const targetBranch = branch || defaultBranch || "main";

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

    showConfirm({
      title: `${config.label} Reset`,
      description: `This will force-update "${targetBranch}" to ${formatHash(hash)}. All commits after this point will be lost. This action is irreversible.`,
      confirmLabel: "Reset (hard)",
      variant: "destructive",
      typedConfirmation: formatHash(hash),
      action: () =>
        executeWithToast(() => ghMutations.reset(hash, targetBranch)),
    });
  }

  function handleCherryPick(hash: string) {
    showConfirm({
      title: "Cherry-pick Commit",
      description: `Apply commit ${formatHash(hash)} onto the "${targetBranch}" branch.`,
      confirmLabel: "Cherry-pick",
      variant: "default",
      action: () =>
        executeWithToast(() => ghMutations.cherryPick([hash], targetBranch)),
    });
  }

  function handleRevert(hash: string) {
    showConfirm({
      title: "Revert Commit",
      description: `Create a new commit on "${targetBranch}" that undoes the changes from ${formatHash(hash)}.`,
      confirmLabel: "Revert",
      variant: "default",
      action: () =>
        executeWithToast(() => ghMutations.revert([hash], targetBranch)),
    });
  }

  // Client-side filter for search
  const commits = data?.commits || [];
  const filteredCommits = search
    ? commits.filter(
        (c) =>
          c.message.toLowerCase().includes(search.toLowerCase()) ||
          c.hash.includes(search) ||
          c.authorName.toLowerCase().includes(search.toLowerCase()),
      )
    : commits;

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
      description="Browse and search through the commit history."
      filters={
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
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
              }}
            >
              <SelectTrigger className="h-9 w-full border-border bg-input/20 text-sm sm:w-auto sm:min-w-35">
                <SelectValue placeholder="All branches" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All branches</SelectItem>
                {branchData.branches.map((b) => (
                  <SelectItem key={b.name} value={b.name}>
                    {b.name} {b.current ? "(default)" : ""}
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
        ) : filteredCommits.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-sm text-muted-foreground">No commits found</p>
          </div>
        ) : (
          <div>
            {filteredCommits.map((commit, i) => (
              <CommitListItem
                key={commit.hash}
                hash={commit.hash}
                abbreviatedHash={commit.abbreviatedHash}
                message={commit.message}
                authorName={commit.authorName}
                date={commit.date}
                refs={commit.refs}
                href={`/repo/commits/${commit.hash}?owner=${encodeURIComponent(githubOwner || "")}&repo=${encodeURIComponent(githubRepoName || "")}`}
                showDivider={i !== 0}
                onCherryPick={() => handleCherryPick(commit.hash)}
                onRevert={() => handleRevert(commit.hash)}
                onReset={(mode) => handleReset(commit.hash, mode)}
              />
            ))}
          </div>
        )}
      </div>

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
