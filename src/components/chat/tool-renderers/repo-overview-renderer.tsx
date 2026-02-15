import { Button } from "@/components/ui/button";
import { GitBranch, GitCommit, FolderTree, Info } from "lucide-react";
import type { ToolRendererProps } from "./registry";

interface RepoOverview {
  path: string;
  currentBranch: string;
  headCommit: { hash: string; message: string };
  remotes: { name: string; fetchUrl: string }[];
  isClean: boolean;
  staged: number;
  modified: number;
  untracked: number;
}

export function RepoOverviewRenderer({ output, onAction }: ToolRendererProps) {
  const data = output as RepoOverview;
  if (!data?.path) return null;

  return (
    <div className="space-y-3">
      <div className="rounded-md border border-border bg-muted/30 p-3 space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Info className="size-4 text-muted-foreground" />
          <span className="font-mono">{data.path}</span>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted-foreground">
          <span>Default branch</span>
          <span className="font-mono text-foreground">{data.currentBranch}</span>
          <span>HEAD</span>
          <span className="font-mono text-foreground truncate" title={data.headCommit?.message}>
            {data.headCommit?.hash?.slice(0, 7)} {data.headCommit?.message}
          </span>
          <span>Status</span>
          <span className="text-foreground">
            {data.isClean ? "Clean" : `${data.modified} modified, ${data.staged} staged, ${data.untracked} untracked`}
          </span>
          {data.remotes?.map((r) => (
            <span key={r.name} className="contents">
              <span>Remote ({r.name})</span>
              <span className="font-mono text-foreground truncate">{r.fetchUrl}</span>
            </span>
          ))}
        </div>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          onClick={() => onAction("List all branches")}
        >
          <GitBranch className="mr-1.5 size-3" />
          View branches
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          onClick={() => onAction("Show recent commits")}
        >
          <GitCommit className="mr-1.5 size-3" />
          Recent commits
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="h-7 text-xs"
          onClick={() => onAction("List files in the root directory")}
        >
          <FolderTree className="mr-1.5 size-3" />
          Browse files
        </Button>
      </div>
    </div>
  );
}
