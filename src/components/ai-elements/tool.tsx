"use client";

import type { DynamicToolUIPart, ToolUIPart } from "ai";
import type { ComponentProps, ReactNode } from "react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import {
  CheckCircle2Icon,
  ChevronDownIcon,
  CircleDotIcon,
  CircleXIcon,
  LoaderCircleIcon,
  ShieldAlertIcon,
  WrenchIcon,
  XCircleIcon,
} from "lucide-react";
import { isValidElement } from "react";

export type ToolPart = ToolUIPart | DynamicToolUIPart;

// ─── GitHub Actions–style status indicators ───────────────────────────────

const statusConfig: Record<ToolPart["state"], { icon: ReactNode; label: string; className: string }> = {
  "input-streaming": {
    icon: <CircleDotIcon className="size-3.5" />,
    label: "Queued",
    className: "text-muted-foreground",
  },
  "input-available": {
    icon: <LoaderCircleIcon className="size-3.5 animate-spin" />,
    label: "Running",
    className: "text-yellow-500",
  },
  "approval-requested": {
    icon: <ShieldAlertIcon className="size-3.5" />,
    label: "Waiting",
    className: "text-yellow-500",
  },
  "approval-responded": {
    icon: <CheckCircle2Icon className="size-3.5" />,
    label: "Responded",
    className: "text-blue-500",
  },
  "output-available": {
    icon: <CheckCircle2Icon className="size-3.5" />,
    label: "Completed",
    className: "text-green-500",
  },
  "output-denied": {
    icon: <CircleXIcon className="size-3.5" />,
    label: "Skipped",
    className: "text-muted-foreground",
  },
  "output-error": {
    icon: <XCircleIcon className="size-3.5" />,
    label: "Failed",
    className: "text-red-500",
  },
};

export const getStatusIndicator = (state: ToolPart["state"]) => {
  const config = statusConfig[state];
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs", config.className)}>
      {config.icon}
      {config.label}
    </span>
  );
};

// ─── Components ───────────────────────────────────────────────────────────

export const Tool = ({ className, ...props }: ComponentProps<typeof Collapsible>) => (
  <Collapsible
    className={cn("group not-prose mb-4 w-full rounded-md border", className)}
    {...props}
  />
);

export type ToolHeaderProps = {
  title?: string;
  className?: string;
} & (
  | { type: ToolUIPart["type"]; state: ToolUIPart["state"]; toolName?: never }
  | { type: DynamicToolUIPart["type"]; state: DynamicToolUIPart["state"]; toolName: string }
);

export const ToolHeader = ({ className, title, type, state, toolName }: ToolHeaderProps) => {
  const name = type === "dynamic-tool" ? toolName : type.split("-").slice(1).join("-");

  return (
    <CollapsibleTrigger className={cn("flex w-full items-center justify-between gap-4 p-3", className)}>
      <div className="flex items-center gap-2">
        <WrenchIcon className="size-4 text-muted-foreground" />
        <span className="text-sm font-medium">{title ?? name}</span>
        {getStatusIndicator(state)}
      </div>
      <ChevronDownIcon className="size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
    </CollapsibleTrigger>
  );
};

export const ToolContent = ({ className, ...props }: ComponentProps<typeof CollapsibleContent>) => (
  <CollapsibleContent className={cn("space-y-4 p-4", className)} {...props} />
);

export const ToolInput = ({ className, input, ...props }: ComponentProps<"div"> & { input: ToolPart["input"] }) => (
  <div className={cn("space-y-2 overflow-hidden", className)} {...props}>
    <h4 className="text-muted-foreground font-medium">Parameters</h4>
    <pre className="overflow-x-auto rounded-md bg-muted/50 p-3 font-mono text-xs">
      <code>{JSON.stringify(input, null, 2)}</code>
    </pre>
  </div>
);

export const ToolOutput = ({
  className,
  output,
  errorText,
  ...props
}: ComponentProps<"div"> & { output: ToolPart["output"]; errorText: ToolPart["errorText"] }) => {
  if (!output && !errorText) return null;

  const content = errorText
    ? <div>{errorText}</div>
    : typeof output === "object" && !isValidElement(output)
      ? <pre className="overflow-x-auto p-3 font-mono text-xs"><code>{JSON.stringify(output, null, 2)}</code></pre>
      : typeof output === "string"
        ? <pre className="overflow-x-auto p-3 font-mono text-xs"><code>{output}</code></pre>
        : <div>{output as ReactNode}</div>;

  return (
    <div className={cn("space-y-2", className)} {...props}>
      <h4 className="text-muted-foreground font-medium">{errorText ? "Error" : "Result"}</h4>
      <div className={cn("overflow-x-auto rounded-md text-xs", errorText ? "bg-destructive/10 text-destructive" : "bg-muted/50")}>
        {content}
      </div>
    </div>
  );
};
