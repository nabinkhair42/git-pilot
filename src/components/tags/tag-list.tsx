"use client";

import { useState } from "react";
import {
  Tag,
  Trash2,
  MoreHorizontal,
  Plus,
  BookMarked,
} from "lucide-react";
import { toast } from "sonner";
import { useGitMutations } from "@/hooks/use-git";
import { useRepo } from "@/hooks/use-repo";
import { useUnifiedTags } from "@/hooks/use-unified";
import { formatRelativeDate, formatHash } from "@/lib/formatters";
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
import { TagListSkeleton } from "@/components/loaders/tag-list-skeleton";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";

export function TagList() {
  const { mode } = useRepo();
  const isGitHub = mode === "github";
  const { data, isLoading, error } = useUnifiedTags();
  const mutations = useGitMutations();

  const [createOpen, setCreateOpen] = useState(false);
  const [tagName, setTagName] = useState("");
  const [tagMessage, setTagMessage] = useState("");
  const [createLoading, setCreateLoading] = useState(false);

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

  async function handleCreate() {
    if (!tagName.trim()) return;
    setCreateLoading(true);
    try {
      const result = await mutations.createTag(
        tagName.trim(),
        tagMessage.trim() || undefined
      );
      if (result.success) {
        toast.success(result.message);
        setCreateOpen(false);
        setTagName("");
        setTagMessage("");
      } else {
        toast.error(result.message);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create tag");
    } finally {
      setCreateLoading(false);
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
      <div className="rail-bounded flex items-center justify-center py-20">
        <p className="text-sm text-destructive">
          Failed to load tags: {error.message}
        </p>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="rail-bounded px-6">
        <div className="flex items-end justify-between pb-4 pt-8">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Releases
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">Tags</h2>
          </div>
          {!isGitHub && (
            <Button
              size="sm"
              onClick={() => setCreateOpen(true)}
              className="bg-foreground text-background transition-opacity hover:opacity-80"
            >
              <Plus size={14} className="mr-1.5" />
              New Tag
            </Button>
          )}
        </div>

        {/* Search */}
        {tags.length > 5 && (
          <div className="pb-4">
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter tags..."
              className="h-9 max-w-xs border-border bg-input/20 text-sm placeholder:text-muted-foreground/50 focus:border-primary/40 focus:ring-1 focus:ring-primary/20"
            />
          </div>
        )}
      </div>

      <div className="section-divider" aria-hidden="true" />

      {/* Tag list */}
      <div className="rail-bounded border-t border-border">
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
              <div
                key={tag.name}
                className={`group flex items-center gap-4 px-6 py-4 transition-colors hover:bg-accent/50 ${
                  i !== 0 ? "border-t border-dashed border-border" : ""
                }`}
              >
                <div className="flex size-5 shrink-0 items-center justify-center">
                  {tag.isAnnotated ? (
                    <BookMarked size={14} className="text-git-modified" />
                  ) : (
                    <Tag size={14} className="text-muted-foreground" />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-sm font-medium text-foreground">
                      {tag.name}
                    </span>
                    {tag.isAnnotated && (
                      <Badge
                        variant="outline"
                        className="border-git-modified/30 px-1.5 py-0 text-[10px] text-git-modified"
                      >
                        annotated
                      </Badge>
                    )}
                  </div>
                  <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{formatHash(tag.hash)}</span>
                    {tag.message && (
                      <>
                        <span>&middot;</span>
                        <span className="truncate">{tag.message}</span>
                      </>
                    )}
                    {tag.date && (
                      <>
                        <span>&middot;</span>
                        <span>{formatRelativeDate(tag.date)}</span>
                      </>
                    )}
                    {tag.tagger && (
                      <>
                        <span>&middot;</span>
                        <span>{tag.tagger}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(tag.name);
                      toast.success("Tag name copied");
                    }}
                    className="border-border text-xs opacity-0 transition-all group-hover:opacity-100 hover:bg-accent/60"
                  >
                    Copy
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
                        onClick={() => {
                          navigator.clipboard.writeText(tag.hash);
                          toast.success("Hash copied");
                        }}
                      >
                        Copy hash
                      </DropdownMenuItem>
                      {!isGitHub && (
                        <DropdownMenuItem
                          onClick={() =>
                            setDeleteConfirm({ open: true, name: tag.name })
                          }
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 size={14} className="mr-2" />
                          Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create tag dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="border-border bg-background">
          <DialogHeader>
            <DialogTitle>Create New Tag</DialogTitle>
            <DialogDescription>
              Create a tag on the current HEAD commit. Add a message to create an
              annotated tag.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1.5">
              <label className="text-sm text-muted-foreground">Tag name</label>
              <Input
                value={tagName}
                onChange={(e) => setTagName(e.target.value)}
                placeholder="v1.0.0"
                className="font-mono text-sm"
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm text-muted-foreground">
                Message (optional, creates annotated tag)
              </label>
              <Input
                value={tagMessage}
                onChange={(e) => setTagMessage(e.target.value)}
                placeholder="Release version 1.0.0"
                className="text-sm"
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCreateOpen(false)}
              className="border-border transition-colors hover:bg-accent/60"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!tagName.trim()}
              isLoading={createLoading}
              className="bg-foreground text-background transition-opacity hover:opacity-80"
            >
              Create
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
        title="Delete Tag"
        description={`This will delete the tag "${deleteConfirm.name}".`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
        loading={deleteLoading}
      />
    </>
  );
}
