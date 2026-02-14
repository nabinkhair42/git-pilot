"use client";

import { TagListSkeleton } from "@/components/loaders/tag-list-skeleton";
import { PageLayout } from "@/components/shared/page-layout";
import { TagListItem } from "@/components/tags/tag-list-item";
import { Input } from "@/components/ui/input";
import { useUnifiedTags } from "@/hooks/use-unified";
import { useState } from "react";

export function TagList() {
  const { data, isLoading, error } = useUnifiedTags();

  const [search, setSearch] = useState("");

  const tags = data?.tags || [];
  const filteredTags = search
    ? tags.filter(
        (t) =>
          t.name.toLowerCase().includes(search.toLowerCase()) ||
          t.message.toLowerCase().includes(search.toLowerCase()),
      )
    : tags;

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
      description="View version tags and release markers."
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
                showDivider={i !== 0}
              />
            ))}
          </div>
        )}
      </div>
    </PageLayout>
  );
}
