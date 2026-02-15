import { Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { ToolRendererProps } from "./registry";

interface Contributor {
  username: string;
  avatarUrl: string;
  contributions: number;
  type: string;
  profileUrl: string;
}

interface ContributorListOutput {
  count: number;
  contributors: Contributor[];
}

export function ContributorListRenderer({ output, onAction }: ToolRendererProps) {
  const data = output as ContributorListOutput;
  if (!data?.contributors?.length) return null;

  return (
    <div className="rounded-md border border-border overflow-hidden">
      <div className="flex items-center gap-1.5 border-b border-border bg-muted/30 px-4 py-2 text-xs text-muted-foreground">
        <Users className="size-3.5" />
        {data.count} contributor{data.count !== 1 ? "s" : ""}
      </div>
      <div className="divide-y divide-dashed divide-border">
        {data.contributors.map((contributor) => (
          <button
            key={contributor.username}
            type="button"
            className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-muted/50"
            onClick={() => onAction(`Show me the profile for ${contributor.username}`)}
          >
            <img
              src={contributor.avatarUrl}
              alt={contributor.username}
              className="size-8 rounded-full"
            />
            <div className="flex flex-1 items-center gap-2 min-w-0">
              <span className="truncate text-sm font-medium">
                {contributor.username}
              </span>
              {contributor.type === "Bot" && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  bot
                </Badge>
              )}
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {contributor.contributions} commit{contributor.contributions !== 1 ? "s" : ""}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
