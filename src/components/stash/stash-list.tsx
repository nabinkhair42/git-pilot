"use client";

import { useState } from "react";
import {
  Archive,
  Play,
  ArrowUpFromLine,
  Trash2,
  MoreHorizontal,
  Plus,
  Eraser,
} from "lucide-react";
import { toast } from "sonner";
import { useStashList, useGitMutations, useStatus } from "@/hooks/use-git";
import { formatRelativeDate, formatHash } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { PageLayout } from "@/components/shared/page-layout";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { StashListSkeleton } from "@/components/loaders/stash-list-skeleton";
import { StashSaveDialog } from "@/components/dialog-window/stash-save-dialog";
import { ConfirmationDialog } from "@/components/dialog-window/confirmation-dialog";

export function StashList() {
  const { data, isLoading, error } = useStashList();
  const { data: status } = useStatus();
  const mutations = useGitMutations();

  const [saveOpen, setSaveOpen] = useState(false);

  const [clearConfirm, setClearConfirm] = useState(false);
  const [clearLoading, setClearLoading] = useState(false);

  const [dropConfirm, setDropConfirm] = useState<{
    open: boolean;
    index: number;
  }>({ open: false, index: -1 });
  const [dropLoading, setDropLoading] = useState(false);

  const [applyingIndex, setApplyingIndex] = useState<number | null>(null);
  const [poppingIndex, setPoppingIndex] = useState<number | null>(null);

  const stashes = data?.stashes || [];
  const hasUncommitted = status && !status.isClean;

  async function handleSave(message?: string) {
    const result = await mutations.stashSave(message, true);
    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
      throw new Error(result.message);
    }
  }

  async function handleApply(index: number) {
    setApplyingIndex(index);
    try {
      const result = await mutations.stashApply(index);
      if (result.success) toast.success(result.message);
      else toast.error(result.message);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Apply failed");
    } finally {
      setApplyingIndex(null);
    }
  }

  async function handlePop(index: number) {
    setPoppingIndex(index);
    try {
      const result = await mutations.stashPop(index);
      if (result.success) toast.success(result.message);
      else toast.error(result.message);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Pop failed");
    } finally {
      setPoppingIndex(null);
    }
  }

  async function handleDrop() {
    setDropLoading(true);
    try {
      const result = await mutations.stashDrop(dropConfirm.index);
      if (result.success) {
        toast.success(result.message);
        setDropConfirm({ open: false, index: -1 });
      } else {
        toast.error(result.message);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Drop failed");
    } finally {
      setDropLoading(false);
    }
  }

  async function handleClear() {
    setClearLoading(true);
    try {
      const result = await mutations.stashClear();
      if (result.success) {
        toast.success(result.message);
        setClearConfirm(false);
      } else {
        toast.error(result.message);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Clear failed");
    } finally {
      setClearLoading(false);
    }
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-20">
        <p className="text-sm text-destructive">
          Failed to load stashes: {error.message}
        </p>
      </div>
    );
  }

  return (
    <PageLayout
      label="Working Tree"
      title="Stashes"
      actions={
        <div className="flex gap-2">
          {stashes.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setClearConfirm(true)}
              className="border-border text-destructive transition-colors hover:bg-destructive/10"
            >
              <Eraser size={14} className="mr-1.5" />
              Clear All
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => setSaveOpen(true)}
            disabled={!hasUncommitted}
            className="bg-foreground text-background transition-opacity hover:opacity-80"
          >
            <Plus size={14} className="mr-1.5" />
            Stash Changes
          </Button>
        </div>
      }
      filters={
        !hasUncommitted ? (
          <p className="pb-4 text-xs text-muted-foreground/60">
            Working tree is clean. Make some changes to stash them.
          </p>
        ) : undefined
      }
    >
      <div className="section-divider" aria-hidden="true" />

      {/* Stash list */}
      <div>
        {isLoading ? (
          <StashListSkeleton />
        ) : stashes.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-sm text-muted-foreground">No stashes</p>
          </div>
        ) : (
          <div>
            {stashes.map((stash, i) => (
              <div
                key={stash.index}
                className={`group flex items-center gap-4 px-6 py-4 transition-colors hover:bg-muted ${
                  i !== 0 ? "border-t border-dashed border-border" : ""
                }`}
              >
                <div className="flex size-5 shrink-0 items-center justify-center">
                  <Archive size={14} className="text-muted-foreground" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs text-muted-foreground/60">
                      stash@{"{"}
                      {stash.index}
                      {"}"}
                    </span>
                    <span className="truncate text-sm font-medium text-foreground">
                      {stash.message.replace(/^WIP on .+?: [a-f0-9]+ /, "").replace(/^On .+?: /, "") || "Untitled stash"}
                    </span>
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatHash(stash.hash)}</span>
                    {stash.date && (
                      <>
                        <span>&middot;</span>
                        <span>{formatRelativeDate(stash.date)}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePop(stash.index)}
                    isLoading={poppingIndex === stash.index}
                    disabled={applyingIndex !== null || poppingIndex !== null}
                    className="border-border text-xs transition-colors hover:bg-accent"
                  >
                    <ArrowUpFromLine size={12} className="mr-1" />
                    Pop
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleApply(stash.index)}
                    isLoading={applyingIndex === stash.index}
                    disabled={applyingIndex !== null || poppingIndex !== null}
                    className="border-border text-xs transition-colors hover:bg-accent"
                  >
                    <Play size={12} className="mr-1" />
                    Apply
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
                          setDropConfirm({ open: true, index: stash.index })
                        }
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 size={14} className="mr-2" />
                        Drop
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <StashSaveDialog
        open={saveOpen}
        onOpenChange={setSaveOpen}
        onSubmit={handleSave}
      />

      {/* Drop confirmation */}
      <ConfirmationDialog
        open={dropConfirm.open}
        onOpenChange={(open) =>
          setDropConfirm((prev) => ({ ...prev, open }))
        }
        title="Drop Stash"
        description={`This will permanently delete stash@{${dropConfirm.index}}. This cannot be undone.`}
        confirmLabel="Drop"
        variant="destructive"
        onConfirm={handleDrop}
        loading={dropLoading}
      />

      {/* Clear all confirmation */}
      <ConfirmationDialog
        open={clearConfirm}
        onOpenChange={setClearConfirm}
        title="Clear All Stashes"
        description="This will permanently delete all stashes. This cannot be undone."
        confirmLabel="Clear All"
        variant="destructive"
        typedConfirmation="clear all"
        onConfirm={handleClear}
        loading={clearLoading}
      />
    </PageLayout>
  );
}
