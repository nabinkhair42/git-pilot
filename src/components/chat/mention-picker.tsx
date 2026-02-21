"use client";

import { useEffect, useRef } from "react";
import type { MentionItem, MentionCategory } from "@/lib/mentions/types";
import type { MentionQuery } from "@/hooks/use-mention-query";
import { CATEGORY_ICONS } from "@/lib/mentions/icons";
import { MENTION_CATEGORIES } from "@/config/constants";
import { useRepo } from "@/hooks/use-repo";
import { useMentionCandidates } from "@/hooks/use-mention-candidates";
import {
  Command,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from "@/components/ui/command";
import { Spinner } from "@/components/ui/spinner";

interface MentionPickerProps {
  query: MentionQuery;
  onSelect: (item: MentionItem) => void;
  onSelectCategory: (category: MentionCategory) => void;
  onClose: () => void;
}

export function MentionPicker({
  query,
  onSelect,
  onSelectCategory,
  onClose,
}: MentionPickerProps) {
  const { githubOwner, githubRepoName } = useRepo();
  const commandRef = useRef<HTMLDivElement>(null);

  const { data: candidates, isLoading } = useMentionCandidates(
    query.active && query.mode === "search" ? query.category : null,
    query.active && query.mode === "search" ? query.search : ""
  );

  const visibleCategories = MENTION_CATEGORIES;

  // Close on click outside
  useEffect(() => {
    if (!query.active) return;
    const handler = (e: MouseEvent) => {
      if (commandRef.current && !commandRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [query.active, onClose]);

  if (!query.active) return null;

  // Check if repo context is available
  const hasRepoContext = !!githubOwner && !!githubRepoName;

  // Non-repo categories require a repo to be selected
  const needsRepo =
    query.mode === "search" &&
    query.category !== null &&
    query.category !== "repository" &&
    !hasRepoContext;

  // Group candidates by category for cross-category search
  const grouped = query.category === null && candidates.length > 0
    ? candidates.reduce<Record<string, MentionItem[]>>((acc, item) => {
        const key = item.category;
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
      }, {})
    : null;

  return (
    <div
      ref={commandRef}
      // Prevent textarea from losing focus when clicking picker items
      onMouseDown={(e) => e.preventDefault()}
      className="absolute inset-x-0 bottom-full z-50 mb-1 overflow-hidden rounded-lg border border-border bg-popover shadow-lg"
    >
      {query.mode === "categories" ? (
        /* ── Category buttons ── */
        <div className="grid grid-cols-3 gap-1 p-2 bg-background backdrop-blur-3xl bg-opacity-80">
          {visibleCategories.map((cat) => {
            const Icon = CATEGORY_ICONS[cat.id];
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onSelectCategory(cat.id)}
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              >
                <Icon className="size-4" />
                {cat.label}
              </button>
            );
          })}
        </div>
      ) : (
        /* ── Search results ── */
        <Command shouldFilter={false} className="rounded-none">
          <CommandList className="max-h-48">
            {needsRepo ? (
              <div className="px-4 py-6 text-center text-sm text-muted-foreground">
                Select a repo to search {query.category}s
              </div>
            ) : isLoading ? (
              <div className="flex items-center justify-center py-6">
                <Spinner />
              </div>
            ) : candidates.length === 0 ? (
              <CommandEmpty>No items found.</CommandEmpty>
            ) : grouped ? (
              /* Cross-category: grouped results */
              Object.entries(grouped).map(([cat, items]) => {
                const catConfig = MENTION_CATEGORIES.find((c) => c.id === cat);
                return (
                  <CommandGroup key={cat} heading={catConfig?.label ?? cat}>
                    {items.map((item) => (
                      <CommandItem
                        key={item.id}
                        value={item.id}
                        onSelect={() => onSelect(item)}
                        className="gap-2"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-sm">{item.label}</div>
                          {item.description ? (
                            <div className="truncate text-xs text-muted-foreground">
                              {item.description}
                            </div>
                          ) : null}
                        </div>
                      </CommandItem>
                    ))}
                  </CommandGroup>
                );
              })
            ) : (
              /* Single-category results */
              <CommandGroup>
                {candidates.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={item.id}
                    onSelect={() => onSelect(item)}
                    className="gap-2"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm">{item.label}</div>
                      {item.description ? (
                        <div className="truncate text-xs text-muted-foreground">
                          {item.description}
                        </div>
                      ) : null}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      )}
    </div>
  );
}
