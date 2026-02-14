import { TagListItem } from "@/components/github/tag-list-item";
import type { ToolRendererProps } from "./registry";

interface TagListOutput {
  count: number;
  tags: {
    name: string;
    hash: string;
    message?: string;
    date?: string;
    tagger?: string;
    isAnnotated?: boolean;
  }[];
}

export function TagListRenderer({ output }: ToolRendererProps) {
  const data = output as TagListOutput;
  if (!data?.tags?.length) return null;

  return (
    <div className="rounded-md border border-border overflow-hidden">
      <div className="border-b border-border bg-muted/30 px-4 py-2 text-xs text-muted-foreground">
        {data.count} tag{data.count !== 1 ? "s" : ""}
      </div>
      <div className="divide-y divide-dashed divide-border">
        {data.tags.map((tag) => (
          <TagListItem
            key={tag.name}
            name={tag.name}
            hash={tag.hash}
            message={tag.message}
            date={tag.date}
            tagger={tag.tagger}
            isAnnotated={tag.isAnnotated}
          />
        ))}
      </div>
    </div>
  );
}
