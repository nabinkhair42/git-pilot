"use client";

import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";

interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel?: string;
  variant?: "default" | "destructive";
  typedConfirmation?: string;
  onConfirm: () => void;
  loading?: boolean;
}

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Confirm",
  variant = "default",
  typedConfirmation,
  onConfirm,
  loading,
}: ConfirmationDialogProps) {
  const [typed, setTyped] = useState("");

  const canConfirm = typedConfirmation
    ? typed === typedConfirmation
    : true;

  function handleConfirm() {
    if (!canConfirm) return;
    onConfirm();
    setTyped("");
  }

  return (
    <AlertDialog open={open} onOpenChange={(v) => { onOpenChange(v); setTyped(""); }}>
      <AlertDialogContent className="border-border bg-background">
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription className="text-muted-foreground">
            {description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {typedConfirmation && (
          <div className="space-y-2 py-2">
            <p className="text-sm text-muted-foreground">
              Type <code className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-xs text-foreground">{typedConfirmation}</code> to confirm:
            </p>
            <Input
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={typedConfirmation}
              className="font-mono text-sm"
              autoFocus
            />
          </div>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel className="border-white/[0.1] transition-colors hover:bg-white/[0.04]">
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!canConfirm || loading}
            className={
              variant === "destructive"
                ? "bg-destructive text-white hover:bg-destructive/90"
                : "bg-foreground text-background transition-opacity hover:opacity-80"
            }
          >
            {loading ? "Processing..." : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
