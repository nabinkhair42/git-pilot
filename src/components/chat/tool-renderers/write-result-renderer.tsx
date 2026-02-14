import { CheckCircle2, XCircle } from "lucide-react";
import type { ToolRendererProps } from "./registry";

interface WriteResult {
  success: boolean;
  message: string;
}

export function WriteResultRenderer({ output }: ToolRendererProps) {
  const data = output as WriteResult;
  if (!data || typeof data.success !== "boolean") return null;

  return (
    <div
      className={`flex items-start gap-2.5 rounded-md border p-3 ${
        data.success
          ? "border-green-500/30 bg-green-500/5"
          : "border-red-500/30 bg-red-500/5"
      }`}
    >
      {data.success ? (
        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-600" />
      ) : (
        <XCircle className="mt-0.5 size-4 shrink-0 text-red-600" />
      )}
      <p className="text-sm">{data.message}</p>
    </div>
  );
}
