"use client";

import type { MentionItem, MentionCategory } from "@/lib/mentions/types";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  GitCommitHorizontal,
  GitBranch,
  Tag,
  FolderGit2,
  X,
} from "lucide-react";

const CATEGORY_ICONS: Record<MentionCategory, React.ComponentType<{ className?: string }>> = {
  file: FileText,
  commit: GitCommitHorizontal,
  branch: GitBranch,
  tag: Tag,
  repository: FolderGit2,
};

interface MentionChipsProps {
  mentions: MentionItem[];
  onRemove: (id: string) => void;
}

export function MentionChips({ mentions, onRemove }: MentionChipsProps) {
  if (mentions.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1 px-3 pt-2">
      {mentions.map((mention) => {
        const Icon = CATEGORY_ICONS[mention.category];
        const displayLabel =
          mention.label.length > 30
            ? `${mention.label.slice(0, 27)}...`
            : mention.label;

        return (
          <Badge
            key={mention.id}
            variant="secondary"
            className="gap-1 pr-1 text-xs"
          >
            <Icon className="size-3" />
            <span className="max-w-40 truncate">{displayLabel}</span>
            <button
              type="button"
              onClick={() => onRemove(mention.id)}
              className="ml-0.5 rounded-full p-0.5 transition-colors hover:bg-accent"
            >
              <X className="size-3" />
            </button>
          </Badge>
        );
      })}
    </div>
  );
}
