import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

const LABELS: Record<string, string> = {
  deleteBranch: "Delete Branch",
  cherryPickCommits: "Cherry Pick Commit",
  revertCommits: "Revert Commit",
  resetBranch: "Reset Branch",
};

const DESCRIPTIONS: Record<string, (input: Record<string, unknown>) => string> = {
  deleteBranch: (input) =>
    `This will permanently delete branch "${input.branch}". This cannot be undone.`,
  cherryPickCommits: (input) =>
    `This will cherry-pick commit ${String(input.hash).slice(0, 7)} onto "${input.branch}".`,
  revertCommits: (input) =>
    `This will revert commit ${String(input.hash).slice(0, 7)} on "${input.branch}", creating a new undo commit.`,
  resetBranch: (input) =>
    `This will force-reset "${input.branch}" to commit ${String(input.sha).slice(0, 7)}. All commits after this point will be lost.`,
};

interface ApprovalRendererProps {
  toolName: string;
  input: unknown;
  onApprove: () => void;
  onDeny: () => void;
}

export function ApprovalRenderer({ toolName, input, onApprove, onDeny }: ApprovalRendererProps) {
  const label = LABELS[toolName] ?? toolName;
  const descFn = DESCRIPTIONS[toolName];
  const description = descFn
    ? descFn((input ?? {}) as Record<string, unknown>)
    : `This action requires your approval to proceed.`;

  return (
    <div className="rounded-md border border-yellow-500/30 bg-yellow-500/5 p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-yellow-600" />
        <div className="flex-1 space-y-3">
          <div>
            <p className="text-sm font-medium">{label}</p>
            <p className="mt-1 text-xs text-muted-foreground">{description}</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="destructive" onClick={onApprove}>
              Approve
            </Button>
            <Button size="sm" variant="outline" onClick={onDeny}>
              Deny
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
