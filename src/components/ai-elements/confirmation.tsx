"use client";

import type { ToolUIPart } from "ai";
import type { ComponentProps, ReactNode } from "react";
import { createContext, useContext } from "react";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ConfirmationContextValue {
  approval: ToolUIPart["approval"];
  state: ToolUIPart["state"];
}

const ConfirmationContext = createContext<ConfirmationContextValue | null>(null);

function useConfirmation() {
  const ctx = useContext(ConfirmationContext);
  if (!ctx) throw new Error("Confirmation components must be used within <Confirmation>");
  return ctx;
}

export function Confirmation({
  approval,
  state,
  className,
  children,
  ...props
}: ComponentProps<typeof Alert> & { approval: ToolUIPart["approval"]; state: ToolUIPart["state"] }) {
  if (!approval || state === "input-streaming" || state === "input-available") return null;

  return (
    <ConfirmationContext.Provider value={{ approval, state }}>
      <Alert
        className={cn(
          "flex flex-col gap-3",
          state === "approval-requested" && "border-yellow-500/30 bg-yellow-500/5",
          state === "output-denied" && "border-orange-500/30 bg-orange-500/5",
          (state === "approval-responded" || state === "output-available") &&
            approval.approved && "border-green-500/30 bg-green-500/5",
          className,
        )}
        {...props}
      >
        {children}
      </Alert>
    </ConfirmationContext.Provider>
  );
}

export function ConfirmationRequest({ children }: { children: ReactNode }) {
  const { state } = useConfirmation();
  if (state !== "approval-requested") return null;
  return <div className="text-sm">{children}</div>;
}

export function ConfirmationAccepted({ children }: { children: ReactNode }) {
  const { approval, state } = useConfirmation();
  if (!approval?.approved) return null;
  if (state !== "approval-responded" && state !== "output-available") return null;
  return <div className="flex items-center gap-2 text-sm text-green-600">{children}</div>;
}

export function ConfirmationRejected({ children }: { children: ReactNode }) {
  const { approval, state } = useConfirmation();
  if (approval?.approved !== false) return null;
  if (state !== "approval-responded" && state !== "output-denied") return null;
  return <div className="flex items-center gap-2 text-sm text-orange-600">{children}</div>;
}

export function ConfirmationActions({ className, ...props }: ComponentProps<"div">) {
  const { state } = useConfirmation();
  if (state !== "approval-requested") return null;
  return <div className={cn("flex items-center gap-2", className)} {...props} />;
}

export function ConfirmationAction(props: ComponentProps<typeof Button>) {
  return <Button size="sm" {...props} />;
}
