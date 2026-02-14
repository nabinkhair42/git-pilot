import { File, Folder } from "lucide-react";
import type { ToolRendererProps } from "./registry";

interface FileListOutput {
  ref: string;
  directory: string;
  count: number;
  files: { name: string; path: string; type: string }[];
  error?: string;
}

export function FileListRenderer({ output, onAction }: ToolRendererProps) {
  const data = output as FileListOutput;

  if (data?.error) {
    return <p className="text-sm text-destructive">{data.error}</p>;
  }

  if (!data?.files?.length) return null;

  return (
    <div className="rounded-md border border-border overflow-hidden">
      <div className="border-b border-border bg-muted/30 px-4 py-2 text-xs text-muted-foreground">
        <span className="font-mono">{data.directory}</span>
        <span className="mx-1.5">&middot;</span>
        <span>{data.count} item{data.count !== 1 ? "s" : ""}</span>
        <span className="mx-1.5">&middot;</span>
        <span>ref: {data.ref}</span>
      </div>
      <div className="divide-y divide-border">
        {data.files.map((file) => {
          const isDir = file.type === "tree" || file.type === "dir";
          return (
            <button
              key={file.path}
              type="button"
              className="flex w-full items-center gap-2 px-4 py-2 text-xs hover:bg-muted/50 transition-colors text-left"
              onClick={() =>
                isDir
                  ? onAction(`List files in ${file.path}`)
                  : onAction(`Show me the content of ${file.path}`)
              }
            >
              {isDir ? (
                <Folder className="size-3.5 shrink-0 text-blue-500" />
              ) : (
                <File className="size-3.5 shrink-0 text-muted-foreground" />
              )}
              <span className="font-mono truncate">{file.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
