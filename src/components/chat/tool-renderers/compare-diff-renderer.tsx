"use client";

import dynamic from "next/dynamic";
import { Badge } from "@/components/ui/badge";
import { ArrowRight } from "lucide-react";
import type { ToolRendererProps } from "./registry";

const DiffViewer = dynamic(() => import("@/components/github/diff-viewer"), {
  ssr: false,
  loading: () => <div className="py-4 text-center text-xs text-muted-foreground">Loading diff...</div>,
});

interface CompareDiffOutput {
  from: string;
  to: string;
  diffLength: number;
  diff: string;
}

export function CompareDiffRenderer({ output }: ToolRendererProps) {
  const data = output as CompareDiffOutput;
  if (!data?.diff) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 text-xs">
        <Badge variant="outline" className="font-mono">{data.from}</Badge>
        <ArrowRight className="size-3 text-muted-foreground" />
        <Badge variant="outline" className="font-mono">{data.to}</Badge>
      </div>
      <div className="rounded-md border border-border overflow-hidden">
        <DiffViewer diff={data.diff} />
      </div>
    </div>
  );
}
