"use client";

import { useState } from "react";
import {
  GitBranch,
  Check,
  Trash2,
  GitMerge,
  MoreHorizontal,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { useGitMutations } from "@/hooks/use-git";
import { useRepo } from "@/hooks/use-repo";
import { useUnifiedBranches } from "@/hooks/use-unified";
import { PageLayout } from "@/components/shared/page-layout";
import { formatHash } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BranchListSkeleton } from "@/components/loaders/branch-list-skeleton";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";

export function BranchList() {
  const { mode } = useRepo();
  const isGitHub = mode === "github";
  const { data, isLoading, error } = useUnifiedBranches();
  const mutations = useGitMutations();

  const [createOpen, setCreateOpen] = useState(false);
  const [newBranchName, setNewBranchName] = useState("");
  const [createLoading, setCreateLoading] = useState(false);

  const [mergeOpen, setMergeOpen] = useState(false);
  const [mergeSource, setMergeSource] = useState("");
  const [mergeLoading, setMergeLoading] = useState(false);

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
        b.name.toLowerCase().includes(search.toLowerCase())
      )
    : allBranches;

  const localBranches = filteredBranches.filter((b) => !b.isRemote);
  const remoteBranches = filteredBranches.filter((b) => b.isRemote);
  const branches = filteredBranches;
  const currentBranch = allBranches.filter((b) => !b.isRemote).find((b) => b.current);

  async function handleCreate() {
    if (!newBranchName.trim()) return;
    setCreateLoading(true);
    try {
      const result = await mutations.createBranch(newBranchName.trim());
      if (result.success) {
        toast.success(result.message);
        setCreateOpen(false);
        setNewBranchName("");
      } else {
        toast.error(result.message);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create branch");
    } finally {
      setCreateLoading(false);
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
        setDeleteConfirm({ open: false, name: "", force: false, isRemote: false });
      } else {
        toast.error(result.message);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setDeleteLoading(false);
    }
  }

  async function handleMerge() {
    if (!mergeSource) return;
    setMergeLoading(true);
    try {
      const result = await mutations.mergeBranch(mergeSource);
      if (result.success) {
        toast.success(result.message);
        setMergeOpen(false);
        setMergeSource("");
      } else {
        toast.error(result.message);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Merge failed");
    } finally {
      setMergeLoading(false);
    }
  }

  if (error) {
    return (
      <div className="rail-bounded flex items-center justify-center py-20">
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
                <GitMerge size={14} className="mr-1.5" />
                Merge
              </Button>
              <Button
                size="sm"
                onClick={() => setCreateOpen(true)}
                className="bg-foreground text-background transition-opacity hover:opacity-80"
              >
                <Plus size={14} className="mr-1.5" />
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
      <div className="section-divider" aria-hidden="true" />

      {/* Branch list */}
      <div className="rail-bounded">
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
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
                  Local
                </p>
              </div>
            )}
            {localBranches.map((branch, i) => (
              <div
                key={branch.name}
                className={`group flex flex-col gap-1.5 px-4 py-3 transition-colors hover:bg-muted sm:flex-row sm:items-center sm:gap-4 sm:px-6 sm:py-4 ${
                  i !== 0 ? "border-t border-dashed border-border" : ""
                }`}
              >
                <div className="flex size-5 shrink-0 items-center justify-center">
                  {branch.current ? (
                    <Check size={16} className="text-git-added" />
                  ) : (
                    <GitBranch size={14} className="text-muted-foreground" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-medium text-foreground">
                      {branch.name}
                    </span>
                    {branch.current && (
                      <Badge
                        variant="outline"
                        className="border-git-added/30 px-1.5 py-0 text-[10px] text-git-added"
                      >
                        current
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatHash(branch.commit)}
                  </span>
                </div>

                {!branch.current && !isGitHub && (
                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCheckout(branch.name)}
                      isLoading={checkoutLoading === branch.name}
                      disabled={checkoutLoading !== null}
                      className="border-border text-xs transition-colors hover:bg-accent"
                    >
                      Switch
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
                          onClick={() =>
                            setDeleteConfirm({
                              open: true,
                              name: branch.name,
                              force: false,
                              isRemote: false,
                            })
                          }
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 size={14} className="mr-2" />
                          Delete
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            setDeleteConfirm({
                              open: true,
                              name: branch.name,
                              force: true,
                              isRemote: false,
                            })
                          }
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 size={14} className="mr-2" />
                          Force Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </div>
            ))}

            {/* Remote branches */}
            {remoteBranches.length > 0 && (
              <>
                <div className="px-4 pb-1 pt-4 mt-2 border-t border-border sm:px-6">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
                    Remote
                  </p>
                </div>
                {remoteBranches.map((branch, i) => (
                  <div
                    key={branch.name}
                    className={`group flex flex-col gap-1.5 px-4 py-3 transition-colors hover:bg-muted sm:flex-row sm:items-center sm:gap-4 sm:px-6 sm:py-4 ${
                      i !== 0 ? "border-t border-dashed border-border" : ""
                    }`}
                  >
                    <div className="flex size-5 shrink-0 items-center justify-center">
                      <GitBranch size={14} className="text-muted-foreground/50" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm text-foreground/70">
                          {branch.name}
                        </span>
                        <Badge
                          variant="outline"
                          className="border-git-info/30 px-1.5 py-0 text-[10px] text-git-info"
                        >
                          remote
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatHash(branch.commit)}
                      </span>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      {!isGitHub && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCheckout(branch.name)}
                          isLoading={checkoutLoading === branch.name}
                          disabled={checkoutLoading !== null}
                          className="border-border text-xs transition-colors hover:bg-accent"
                        >
                          Checkout
                        </Button>
                      )}
                      {!isGitHub && (
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
                              onClick={() =>
                                setDeleteConfirm({
                                  open: true,
                                  name: branch.name,
                                  force: false,
                                  isRemote: true,
                                })
                              }
                              className="text-destructive focus:text-destructive"
                            >
                              <Trash2 size={14} className="mr-2" />
                              Delete Remote
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* Create branch dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="border-border bg-background">
          <DialogHeader>
            <DialogTitle>Create New Branch</DialogTitle>
            <DialogDescription>
              Creates a new branch from the current HEAD and switches to it.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <label className="text-sm text-muted-foreground">Branch name</label>
            <Input
              value={newBranchName}
              onChange={(e) => setNewBranchName(e.target.value)}
              placeholder="feature/my-branch"
              className="font-mono text-sm"
              autoFocus
              onKeyDown={(e) => e.key === "Enter" && handleCreate()}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateOpen(false)}
              className="border-border transition-colors hover:bg-accent"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!newBranchName.trim()}
              isLoading={createLoading}
              className="bg-foreground text-background transition-opacity hover:opacity-80"
            >
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Merge dialog */}
      <Dialog open={mergeOpen} onOpenChange={setMergeOpen}>
        <DialogContent className="border-border bg-background">
          <DialogHeader>
            <DialogTitle>Merge Branch</DialogTitle>
            <DialogDescription>
              Merge a branch into {currentBranch?.name || "the current branch"}.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <label className="text-sm text-muted-foreground">
              Source branch
            </label>
            <Select value={mergeSource} onValueChange={setMergeSource}>
              <SelectTrigger className="border-border bg-input/20 font-mono text-sm">
                <SelectValue placeholder="Select branch to merge" />
              </SelectTrigger>
              <SelectContent>
                {allBranches
                  .filter((b) => !b.current)
                  .map((b) => (
                    <SelectItem key={b.name} value={b.name}>
                      {b.name}{b.isRemote ? " (remote)" : ""}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setMergeOpen(false)}
              className="border-border transition-colors hover:bg-accent"
            >
              Cancel
            </Button>
            <Button
              onClick={handleMerge}
              disabled={!mergeSource}
              isLoading={mergeLoading}
              className="bg-foreground text-background transition-opacity hover:opacity-80"
            >
              Merge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <ConfirmationDialog
        open={deleteConfirm.open}
        onOpenChange={(open) =>
          setDeleteConfirm((prev) => ({ ...prev, open }))
        }
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
        typedConfirmation={deleteConfirm.force || deleteConfirm.isRemote ? deleteConfirm.name : undefined}
        onConfirm={handleDelete}
        loading={deleteLoading}
      />
    </PageLayout>
  );
}
