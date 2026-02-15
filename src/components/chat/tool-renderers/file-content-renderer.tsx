import { Badge } from "@/components/ui/badge";
import { FileText } from "lucide-react";
import type { ToolRendererProps } from "./registry";

interface FileContentOutput {
  path: string;
  ref: string;
  size: number;
  content: string;
  error?: string;
}

export function FileContentRenderer({ output }: ToolRendererProps) {
  const data = output as FileContentOutput;

  if (data?.error) {
    return <p className="text-sm text-destructive">{data.error}</p>;
  }

  if (!data?.content) return null;

  return (
    <div className="rounded-md border border-border overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
        <FileText className="size-3 shrink-0" />
        <span className="font-mono truncate">{data.path}</span>
        <Badge variant="outline" className="ml-auto shrink-0 font-mono text-2xs">
          {data.ref}
        </Badge>
        <span className="shrink-0">{formatSize(data.size)}</span>
      </div>
      <pre className="overflow-x-auto p-3 text-xs">
        <code>{data.content}</code>
      </pre>
    </div>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
