import { PRListItem } from "@/components/github/pr-list-item";
import type { ToolRendererProps } from "./registry";

interface PRListOutput {
  count: number;
  pullRequests: {
    number: number;
    title: string;
    state: string;
    author: string;
    createdAt: string;
    updatedAt: string;
    draft: boolean;
    labels: string[];
    head: string;
    base: string;
    url: string;
  }[];
}

export function PRListRenderer({ output, onAction }: ToolRendererProps) {
  const data = output as PRListOutput;
  if (!data?.pullRequests?.length) return null;

  return (
    <div className="rounded-md border border-border overflow-hidden">
      <div className="border-b border-border bg-muted/30 px-4 py-2 text-xs text-muted-foreground">
        {data.count} pull request{data.count !== 1 ? "s" : ""}
      </div>
      <div className="divide-y divide-dashed divide-border">
        {data.pullRequests.map((pr) => (
          <div
            key={pr.number}
            role="button"
            tabIndex={0}
            className="cursor-pointer"
            onClick={() => onAction(`Show details for pull request #${pr.number}`)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onAction(`Show details for pull request #${pr.number}`);
              }
            }}
          >
            <PRListItem
              number={pr.number}
              title={pr.title}
              state={pr.state}
              author={pr.author}
              head={pr.head}
              base={pr.base}
              draft={pr.draft}
              createdAt={pr.createdAt}
              labels={pr.labels}
              onViewDetails={() => onAction(`Show details for pull request #${pr.number}`)}
              onMerge={() => onAction(`Merge pull request #${pr.number}`)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
