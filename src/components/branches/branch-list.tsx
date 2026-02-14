"use client";

import { useState } from "react";
import { GitMerge, Plus } from "lucide-react";
import { toast } from "sonner";
import { useGitMutations } from "@/hooks/use-git";
import { useRepo } from "@/hooks/use-repo";
import { useUnifiedBranches } from "@/hooks/use-unified";
import { PageLayout } from "@/components/shared/page-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BranchListSkeleton } from "@/components/loaders/branch-list-skeleton";
import { BranchListItem } from "@/components/branches/branch-list-item";
import { CreateBranchDialog } from "@/components/dialog-window/create-branch-dialog";
import { MergeBranchDialog } from "@/components/dialog-window/merge-branch-dialog";
import { ConfirmationDialog } from "@/components/dialog-window/confirmation-dialog";

export function BranchList() {
  const { mode } = useRepo();
  const isGitHub = mode === "github";
  const { data, isLoading, error } = useUnifiedBranches();
  const mutations = useGitMutations();

  const [createOpen, setCreateOpen] = useState(false);
  const [mergeOpen, setMergeOpen] = useState(false);

  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    name: string;
    force: boolean;
    isRemote: boolean;
  }>({ open: false, name: "", force: false, isRemote: false });
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);

  const allBranches = data?.branches || [];

  const filteredBranches = search
    ? allBranches.filter((b) =>
        b.name.toLowerCase().includes(search.toLowerCase()),
      )
    : allBranches;

  const localBranches = filteredBranches.filter((b) => !b.isRemote);
  const remoteBranches = filteredBranches.filter((b) => b.isRemote);
  const branches = filteredBranches;
  const currentBranch = allBranches
    .filter((b) => !b.isRemote)
    .find((b) => b.current);

  async function handleCreate(name: string) {
    const result = await mutations.createBranch(name);
    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
      throw new Error(result.message);
    }
  }

  async function handleCheckout(name: string) {
    setCheckoutLoading(name);
    try {
      const result = await mutations.checkoutBranch(name);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Checkout failed");
    } finally {
      setCheckoutLoading(null);
    }
  }

  async function handleDelete() {
    setDeleteLoading(true);
    try {
      const result = deleteConfirm.isRemote
        ? await mutations.deleteRemoteBranch(deleteConfirm.name)
        : await mutations.deleteBranch(deleteConfirm.name, deleteConfirm.force);
      if (result.success) {
        toast.success(result.message);
        setDeleteConfirm({
          open: false,
          name: "",
          force: false,
          isRemote: false,
        });
      } else {
        toast.error(result.message);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeleteLoading(false);
    }
  }

  async function handleMerge(sourceBranch: string) {
    const result = await mutations.mergeBranch(sourceBranch);
    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
      throw new Error(result.message);
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
      actions={
        <div className="flex flex-wrap gap-2">
          {!isGitHub && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setMergeOpen(true)}
                className="border-border transition-colors hover:bg-accent"
              >
                <GitMerge size={14}  />
                Merge
              </Button>
              <Button
                size="sm"
                onClick={() => setCreateOpen(true)}
                className="bg-foreground text-background transition-opacity hover:opacity-80"
              >
                <Plus size={14}  />
                New Branch
              </Button>
            </>
          )}
        </div>
      }
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
        ) : branches.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-sm text-muted-foreground">No branches found</p>
          </div>
        ) : (
          <div>
            {/* Local branches */}
            {localBranches.length > 0 && (
              <div className="px-4 pb-1 pt-4 sm:px-6">
                <p className="text-[11px] font-medium  text-muted-foreground/60">
                  Local
                </p>
              </div>
            )}
            {localBranches.map((branch, i) => (
              <BranchListItem
                key={branch.name}
                name={branch.name}
                commit={branch.commit}
                current={branch.current}
                isGitHub={isGitHub}
                showDivider={i !== 0}
                checkoutLoading={checkoutLoading === branch.name}
                checkoutDisabled={checkoutLoading !== null}
                onCheckout={() => handleCheckout(branch.name)}
                onDelete={(force) =>
                  setDeleteConfirm({
                    open: true,
                    name: branch.name,
                    force,
                    isRemote: false,
                  })
                }
              />
            ))}

            {/* Remote branches */}
            {remoteBranches.length > 0 && (
              <>
                <div className="px-4 pb-1 pt-4 mt-2 border-t border-border sm:px-6">
                  <p className="text-[11px] font-medium  text-muted-foreground/60">
                    Remote
                  </p>
                </div>
                {remoteBranches.map((branch, i) => (
                  <BranchListItem
                    key={branch.name}
                    name={branch.name}
                    commit={branch.commit}
                    isRemote
                    isGitHub={isGitHub}
                    showDivider={i !== 0}
                    checkoutLoading={checkoutLoading === branch.name}
                    checkoutDisabled={checkoutLoading !== null}
                    onCheckout={() => handleCheckout(branch.name)}
                    onDelete={() =>
                      setDeleteConfirm({
                        open: true,
                        name: branch.name,
                        force: false,
                        isRemote: true,
                      })
                    }
                  />
                ))}
              </>
            )}
          </div>
        )}
      </div>

      <CreateBranchDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreate}
      />

      <MergeBranchDialog
        open={mergeOpen}
        onOpenChange={setMergeOpen}
        currentBranchName={currentBranch?.name}
        branches={allBranches}
        onSubmit={handleMerge}
      />

      {/* Delete confirmation */}
      <ConfirmationDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm((prev) => ({ ...prev, open }))}
        title={`${deleteConfirm.isRemote ? "Delete Remote Branch" : `${deleteConfirm.force ? "Force " : ""}Delete Branch`}`}
        description={
          deleteConfirm.isRemote
            ? `This will delete the remote branch "${deleteConfirm.name}". This action pushes a delete to the remote and cannot be undone easily.`
            : `This will delete the branch "${deleteConfirm.name}".${
                deleteConfirm.force
                  ? " Force delete will remove it even if it has unmerged changes."
                  : ""
              }`
        }
        confirmLabel="Delete"
        variant="destructive"
        typedConfirmation={
          deleteConfirm.force || deleteConfirm.isRemote
            ? deleteConfirm.name
            : undefined
        }
        onConfirm={handleDelete}
        loading={deleteLoading}
      />
    </PageLayout>
  );
}
