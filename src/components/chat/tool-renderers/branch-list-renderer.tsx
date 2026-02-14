import { BranchListItem } from "@/components/branches/branch-list-item";
import type { ToolRendererProps } from "./registry";

interface BranchListOutput {
  current: string;
  branches: {
    name: string;
    current: boolean;
    commit: string;
  }[];
}

export function BranchListRenderer({ output, onAction }: ToolRendererProps) {
  const data = output as BranchListOutput;
  if (!data?.branches?.length) return null;

  return (
    <div className="rounded-md border border-border overflow-hidden">
      <div className="border-b border-border bg-muted/30 px-4 py-2 text-xs text-muted-foreground">
        {data.branches.length} branch{data.branches.length !== 1 ? "es" : ""}
      </div>
      <div className="divide-y divide-dashed divide-border">
        {data.branches.map((branch) => (
          <div
            key={branch.name}
            role="button"
            tabIndex={0}
            className="cursor-pointer"
            onClick={() => onAction(`Show recent commits on branch ${branch.name}`)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onAction(`Show recent commits on branch ${branch.name}`);
              }
            }}
          >
            <BranchListItem
              name={branch.name}
              commit={branch.commit}
              current={branch.current}
              onDelete={
                !branch.current
                  ? () => onAction(`Delete branch ${branch.name}`)
                  : undefined
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
}
