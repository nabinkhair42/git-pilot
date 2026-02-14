"use client";

import { useState, useCallback } from "react";
import type { MentionItem, MentionCategory } from "@/lib/mentions/types";
import { MENTION_CATEGORIES } from "@/config/constants";
import { useRepo } from "@/hooks/use-repo";
import { useMentionCandidates } from "@/hooks/use-mention-candidates";
import {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import {
  FileText,
  GitCommitHorizontal,
  GitBranch,
  Tag,
  Archive,
  FolderGit2,
  Check,
} from "lucide-react";

const CATEGORY_ICONS: Record<MentionCategory, React.ComponentType<{ className?: string }>> = {
  file: FileText,
  commit: GitCommitHorizontal,
  branch: GitBranch,
  tag: Tag,
  stash: Archive,
  repository: FolderGit2,
};

interface MentionPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedMentions: MentionItem[];
  onToggle: (item: MentionItem) => void;
  onConfirm: () => void;
}

export function MentionPicker({
  open,
  onOpenChange,
  selectedMentions,
  onToggle,
  onConfirm,
}: MentionPickerProps) {
  const { mode } = useRepo();
  const [activeCategory, setActiveCategory] = useState<MentionCategory>("file");
  const [search, setSearch] = useState("");

  const { data: candidates, isLoading } = useMentionCandidates(
    open ? activeCategory : null,
    search
  );

  const visibleCategories = MENTION_CATEGORIES.filter(
    (cat) => !(cat.id === "stash" && mode === "github")
  );

  const activeCategoryConfig = MENTION_CATEGORIES.find((c) => c.id === activeCategory);

  const isSelected = useCallback(
    (item: MentionItem) => selectedMentions.some((m) => m.id === item.id),
    [selectedMentions]
  );

  const handleConfirm = useCallback(() => {
    onConfirm();
    onOpenChange(false);
    setSearch("");
  }, [onConfirm, onOpenChange]);

  const handleCancel = useCallback(() => {
    onOpenChange(false);
    setSearch("");
  }, [onOpenChange]);

  if (!open) return null;

  return (
    <div className="absolute inset-x-0 bottom-full z-50 mb-1 overflow-hidden rounded-lg border border-border bg-popover shadow-lg">
      {/* Category tabs */}
      <div className="flex gap-0.5 overflow-x-auto border-b border-border px-2 py-1.5">
        {visibleCategories.map((cat) => {
          const Icon = CATEGORY_ICONS[cat.id];
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setActiveCategory(cat.id);
                setSearch("");
              }}
              className={`flex shrink-0 items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-colors ${
                activeCategory === cat.id
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              }`}
            >
              <Icon className="size-3.5" />
              {cat.label}
            </button>
          );
        })}
      </div>

      {/* Command palette */}
      <Command shouldFilter={false} className="rounded-none">
        <CommandInput
          placeholder={activeCategoryConfig?.placeholder || "Search..."}
          value={search}
          onValueChange={setSearch}
        />
        <CommandList className="max-h-48">
          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <Spinner />
            </div>
          ) : candidates.length === 0 ? (
            <CommandEmpty>No items found.</CommandEmpty>
          ) : (
            <CommandGroup>
              {candidates.map((item) => {
                const selected = isSelected(item);
                return (
                  <CommandItem
                    key={item.id}
                    value={item.id}
                    onSelect={() => onToggle(item)}
                    className="gap-2"
                  >
                    <div
                      className={`flex size-4 shrink-0 items-center justify-center rounded border ${
                        selected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-muted-foreground/30"
                      }`}
                    >
                      {selected && <Check className="size-3" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm">{item.label}</div>
                      {item.description && (
                        <div className="truncate text-xs text-muted-foreground">
                          {item.description}
                        </div>
                      )}
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          )}
        </CommandList>
      </Command>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-border px-3 py-2">
        <span className="text-xs text-muted-foreground">
          {selectedMentions.length} selected
        </span>
        <div className="flex gap-1.5">
          <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            size="sm"
            className="h-7 text-xs"
            onClick={handleConfirm}
            disabled={selectedMentions.length === 0}
          >
            Add
          </Button>
        </div>
      </div>
    </div>
  );
}
