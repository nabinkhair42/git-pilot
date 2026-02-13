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
import { useBranches, useGitMutations } from "@/hooks/use-git";
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
  const { data, isLoading, error } = useBranches();
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
  }>({ open: false, name: "", force: false });
  const [deleteLoading, setDeleteLoading] = useState(false);

  const allBranches = data?.branches || [];
  const localBranches = allBranches.filter((b) => !b.isRemote);
  const remoteBranches = allBranches.filter((b) => b.isRemote);
  const branches = allBranches;
  const currentBranch = localBranches.find((b) => b.current);

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
    try {
      const result = await mutations.checkoutBranch(name);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Checkout failed");
    }
  }

  async function handleDelete() {
    setDeleteLoading(true);
    try {
      const result = await mutations.deleteBranch(
        deleteConfirm.name,
        deleteConfirm.force
      );
      if (result.success) {
        toast.success(result.message);
        setDeleteConfirm({ open: false, name: "", force: false });
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
    <>
      {/* Header with actions */}
      <div className="rail-bounded px-6">
        <div className="flex items-end justify-between pb-4 pt-8">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Management
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">Branches</h2>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMergeOpen(true)}
              className="border-white/[0.1] transition-colors hover:bg-white/[0.04]"
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
          </div>
        </div>
      </div>

      <div className="section-divider" aria-hidden="true" />

      {/* Branch list */}
      <div className="rail-bounded border-t border-border">
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
              <div className="px-6 pb-1 pt-4">
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
                  Local
                </p>
              </div>
            )}
            {localBranches.map((branch, i) => (
              <div
                key={branch.name}
                className={`group flex items-center gap-4 px-6 py-4 transition-colors hover:bg-white/[0.02] ${
                  i !== 0 ? "border-t border-dashed border-border" : ""
                }`}
              >
                <div className="flex size-5 shrink-0 items-center justify-center">
                  {branch.current ? (
                    <Check size={16} className="text-green-400" />
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
                        className="border-green-500/30 px-1.5 py-0 text-[10px] text-green-400"
                      >
                        current
                      </Badge>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatHash(branch.commit)}
                  </span>
                </div>

                {!branch.current && (
                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCheckout(branch.name)}
                      className="border-white/[0.1] text-xs transition-colors hover:bg-white/[0.04]"
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
                <div className="px-6 pb-1 pt-4 mt-2 border-t border-border">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/60">
                    Remote
                  </p>
                </div>
                {remoteBranches.map((branch, i) => (
                  <div
                    key={branch.name}
                    className={`group flex items-center gap-4 px-6 py-4 transition-colors hover:bg-white/[0.02] ${
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
                          className="border-blue-500/30 px-1.5 py-0 text-[10px] text-blue-400"
                        >
                          remote
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {formatHash(branch.commit)}
                      </span>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCheckout(branch.name)}
                        className="border-white/[0.1] text-xs transition-colors hover:bg-white/[0.04]"
                      >
                        Checkout
                      </Button>
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
              className="border-white/[0.1] transition-colors hover:bg-white/[0.04]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!newBranchName.trim() || createLoading}
              className="bg-foreground text-background transition-opacity hover:opacity-80"
            >
              {createLoading ? "Creating..." : "Create"}
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
              <SelectTrigger className="border-border bg-white/[0.03] font-mono text-sm">
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
              className="border-white/[0.1] transition-colors hover:bg-white/[0.04]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleMerge}
              disabled={!mergeSource || mergeLoading}
              className="bg-foreground text-background transition-opacity hover:opacity-80"
            >
              {mergeLoading ? "Merging..." : "Merge"}
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
        title={`${deleteConfirm.force ? "Force " : ""}Delete Branch`}
        description={`This will delete the branch "${deleteConfirm.name}".${
          deleteConfirm.force
            ? " Force delete will remove it even if it has unmerged changes."
            : ""
        }`}
        confirmLabel="Delete"
        variant="destructive"
        typedConfirmation={deleteConfirm.force ? deleteConfirm.name : undefined}
        onConfirm={handleDelete}
        loading={deleteLoading}
      />
    </>
  );
}
