"use client";

import { useState } from "react";
import { toast } from "sonner";
import { useGitHubMutations } from "@/hooks/use-github";
import { useUnifiedBranches } from "@/hooks/use-unified";
import { PageLayout } from "@/components/shared/page-layout";
import { Input } from "@/components/ui/input";
import { BranchListSkeleton } from "@/components/loaders/branch-list-skeleton";
import { BranchListItem } from "@/components/branches/branch-list-item";
import { ConfirmationDialog } from "@/components/dialog-window/confirmation-dialog";

export function BranchList() {
  const { data, isLoading, error, mutate } = useUnifiedBranches();
  const ghMutations = useGitHubMutations();

  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    name: string;
  }>({ open: false, name: "" });
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [search, setSearch] = useState("");

  const allBranches = data?.branches || [];

  const filteredBranches = search
    ? allBranches.filter((b) =>
        b.name.toLowerCase().includes(search.toLowerCase()),
      )
    : allBranches;

  async function handleDelete() {
    setDeleteLoading(true);
    try {
      const result = await ghMutations.deleteBranch(deleteConfirm.name);
      if (result.success) {
        toast.success(result.message);
        setDeleteConfirm({ open: false, name: "" });
        mutate();
      } else {
        toast.error(result.message);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeleteLoading(false);
    }
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-destructive">
          Failed to load branches: {error.message}
        </p>
      </div>
    );
  }

  return (
    <PageLayout
      label="Management"
      title="Branches"
      description="View and manage repository branches."
      filters={
        allBranches.length > 5 ? (
          <div className="pb-4">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter branches..."
              className="h-9 w-full border-border bg-input/20 text-sm placeholder:text-muted-foreground/50 focus:border-primary/40 focus:ring-1 focus:ring-primary/20 sm:max-w-xs"
            />
          </div>
        ) : undefined
      }
    >
      {/* Branch list */}
      <div>
        {isLoading ? (
          <BranchListSkeleton />
        ) : filteredBranches.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-sm text-muted-foreground">No branches found</p>
          </div>
        ) : (
          <div>
            {filteredBranches.map((branch, i) => (
              <BranchListItem
                key={branch.name}
                name={branch.name}
                commit={branch.commit}
                current={branch.current}
                showDivider={i !== 0}
                onDelete={() =>
                  setDeleteConfirm({
                    open: true,
                    name: branch.name,
                  })
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* Delete confirmation */}
      <ConfirmationDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm((prev) => ({ ...prev, open }))}
        title="Delete Branch"
        description={`This will delete the branch "${deleteConfirm.name}". This action cannot be undone easily.`}
        confirmLabel="Delete"
        variant="destructive"
        typedConfirmation={deleteConfirm.name}
        onConfirm={handleDelete}
        loading={deleteLoading}
      />
    </PageLayout>
  );
}
