"use client";

import type { DynamicToolUIPart, ToolUIPart } from "ai";
import type { ComponentProps, ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import {
  CheckCircleIcon,
  ChevronDownIcon,
  CircleIcon,
  ClockIcon,
  WrenchIcon,
  XCircleIcon,
} from "lucide-react";
import { isValidElement } from "react";

export type ToolPart = ToolUIPart | DynamicToolUIPart;

// ─── Status maps ──────────────────────────────────────────────────────────

const statusLabels: Record<ToolPart["state"], string> = {
  "approval-requested": "Awaiting Approval",
  "approval-responded": "Responded",
  "input-available": "Running",
  "input-streaming": "Pending",
  "output-available": "Completed",
  "output-denied": "Denied",
  "output-error": "Error",
};

const statusIcons: Record<ToolPart["state"], ReactNode> = {
  "approval-requested": <ClockIcon className="size-4 text-yellow-600" />,
  "approval-responded": <CheckCircleIcon className="size-4 text-blue-600" />,
  "input-available": <ClockIcon className="size-4 animate-pulse" />,
  "input-streaming": <CircleIcon className="size-4" />,
  "output-available": <CheckCircleIcon className="size-4 text-green-600" />,
  "output-denied": <XCircleIcon className="size-4 text-orange-600" />,
  "output-error": <XCircleIcon className="size-4 text-red-600" />,
};

export const getStatusBadge = (status: ToolPart["state"]) => (
  <Badge className="gap-1.5 rounded-full text-xs" variant="secondary">
    {statusIcons[status]}
    {statusLabels[status]}
  </Badge>
);

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
        {getStatusBadge(state)}
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
