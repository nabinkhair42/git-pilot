import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface MergeBranchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentBranchName?: string;
  branches: { name: string; current?: boolean; isRemote?: boolean }[];
  onSubmit: (sourceBranch: string) => Promise<void>;
}

export function MergeBranchDialog({
  open,
  onOpenChange,
  currentBranchName,
  branches,
  onSubmit,
}: MergeBranchDialogProps) {
  const [source, setSource] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!source) return;
    setLoading(true);
    try {
      await onSubmit(source);
      setSource("");
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) setSource("");
      }}
    >
      <DialogContent className="border-border bg-background">
        <DialogHeader>
          <DialogTitle>Merge Branch</DialogTitle>
          <DialogDescription>
            Merge a branch into {currentBranchName || "the current branch"}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <label className="text-sm text-muted-foreground">Source branch</label>
          <Select value={source} onValueChange={setSource}>
            <SelectTrigger className="border-border bg-input/20 font-mono text-sm">
              <SelectValue placeholder="Select branch to merge" />
            </SelectTrigger>
            <SelectContent>
              {branches
                .filter((b) => !b.current)
                .map((b) => (
                  <SelectItem key={b.name} value={b.name}>
                    {b.name}
                    {b.isRemote ? " (remote)" : ""}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="border-border transition-colors hover:bg-accent"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!source}
            isLoading={loading}
            className="bg-foreground text-background transition-opacity hover:opacity-80"
          >
            Merge
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
