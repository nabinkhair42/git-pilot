"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useGitMutations } from "@/hooks/use-git";
import { useRepo } from "@/hooks/use-repo";
import { useUnifiedTags } from "@/hooks/use-unified";
import { PageLayout } from "@/components/shared/page-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TagListSkeleton } from "@/components/loaders/tag-list-skeleton";
import { TagListItem } from "@/components/tags/tag-list-item";
import { CreateTagDialog } from "@/components/dialog-window/create-tag-dialog";
import { ConfirmationDialog } from "@/components/dialog-window/confirmation-dialog";

export function TagList() {
  const { mode } = useRepo();
  const isGitHub = mode === "github";
  const { data, isLoading, error } = useUnifiedTags();
  const mutations = useGitMutations();

  const [createOpen, setCreateOpen] = useState(false);

  const [search, setSearch] = useState("");

  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    name: string;
  }>({ open: false, name: "" });
  const [deleteLoading, setDeleteLoading] = useState(false);

  const tags = data?.tags || [];
  const filteredTags = search
    ? tags.filter(
        (t) =>
          t.name.toLowerCase().includes(search.toLowerCase()) ||
          t.message.toLowerCase().includes(search.toLowerCase())
      )
    : tags;

  async function handleCreate(name: string, message?: string) {
    const result = await mutations.createTag(name, message);
    if (result.success) {
      toast.success(result.message);
    } else {
      toast.error(result.message);
      throw new Error(result.message);
    }
  }

  async function handleDelete() {
    setDeleteLoading(true);
    try {
      const result = await mutations.deleteTag(deleteConfirm.name);
      if (result.success) {
        toast.success(result.message);
        setDeleteConfirm({ open: false, name: "" });
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
          Failed to load tags: {error.message}
        </p>
      </div>
    );
  }

  return (
    <PageLayout
      label="Releases"
      title="Tags"
      description="Manage version tags and release markers."
      actions={
        !isGitHub ? (
          <Button
            size="sm"
            onClick={() => setCreateOpen(true)}
            className="bg-foreground text-background transition-opacity hover:opacity-80"
          >
            <Plus size={14}  />
            New Tag
          </Button>
        ) : undefined
      }
      filters={
        tags.length > 5 ? (
          <div className="pb-4">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter tags..."
              className="h-9 max-w-xs border-border bg-input/20 text-sm placeholder:text-muted-foreground/50 focus:border-primary/40 focus:ring-1 focus:ring-primary/20"
            />
          </div>
        ) : undefined
      }
    >


      {/* Tag list */}
      <div>
        {isLoading ? (
          <TagListSkeleton />
        ) : filteredTags.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <p className="text-sm text-muted-foreground">
              {tags.length === 0 ? "No tags" : "No tags matching filter"}
            </p>
          </div>
        ) : (
          <div>
            {filteredTags.map((tag, i) => (
              <TagListItem
                key={tag.name}
                name={tag.name}
                hash={tag.hash}
                message={tag.message}
                date={tag.date}
                tagger={tag.tagger}
                isAnnotated={tag.isAnnotated}
                isGitHub={isGitHub}
                showDivider={i !== 0}
                onDelete={() =>
                  setDeleteConfirm({ open: true, name: tag.name })
                }
              />
            ))}
          </div>
        )}
      </div>

      <CreateTagDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSubmit={handleCreate}
      />

      {/* Delete confirmation */}
      <ConfirmationDialog
        open={deleteConfirm.open}
        onOpenChange={(open) =>
          setDeleteConfirm((prev) => ({ ...prev, open }))
        }
        title="Delete Tag"
        description={`This will delete the tag "${deleteConfirm.name}".`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
        loading={deleteLoading}
      />
    </PageLayout>
  );
}
