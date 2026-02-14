import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface StashSaveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (message?: string) => Promise<void>;
}

export function StashSaveDialog({
  open,
  onOpenChange,
  onSubmit,
}: StashSaveDialogProps) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    try {
      await onSubmit(message || undefined);
      setMessage("");
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
        if (!v) setMessage("");
      }}
    >
      <DialogContent className="border-border bg-background">
        <DialogHeader>
          <DialogTitle>Stash Changes</DialogTitle>
          <DialogDescription>
            Save your uncommitted changes and revert the working tree to HEAD.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          <label className="text-sm text-muted-foreground">
            Message (optional)
          </label>
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="WIP: describe your changes"
            className="text-sm"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
          />
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
            isLoading={loading}
            className="bg-foreground text-background transition-opacity hover:opacity-80"
          >
            Stash
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
