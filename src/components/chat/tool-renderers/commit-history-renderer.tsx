import { CommitListItem } from "@/components/commits/commit-list-item";
import type { ToolRendererProps } from "./registry";

interface CommitHistoryOutput {
  total: number;
  count: number;
  commits: {
    hash: string;
    fullHash: string;
    message: string;
    author: string;
    date: string;
    refs?: string;
  }[];
}

export function CommitHistoryRenderer({ output, onAction }: ToolRendererProps) {
  const data = output as CommitHistoryOutput;
  if (!data?.commits?.length) return null;

  return (
    <div className="rounded-md border border-border overflow-hidden">
      <div className="border-b border-border bg-muted/30 px-4 py-2 text-xs text-muted-foreground">
        {data.count} commit{data.count !== 1 ? "s" : ""}
      </div>
      <div className="divide-y divide-dashed divide-border">
        {data.commits.map((commit) => (
          <CommitListItem
            key={commit.fullHash}
            hash={commit.fullHash}
            abbreviatedHash={commit.hash}
            message={commit.message}
            authorName={commit.author}
            date={commit.date}
            refs={commit.refs}
            href="#"
            onCherryPick={() => onAction(`Cherry-pick commit ${commit.hash} onto the default branch`)}
            onRevert={() => onAction(`Revert commit ${commit.hash} on the default branch`)}
            onReset={(mode) => onAction(`Reset the default branch to commit ${commit.hash} using ${mode} reset`)}
          />
        ))}
      </div>
    </div>
  );
}
