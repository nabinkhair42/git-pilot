"use client";

import { useMemo } from "react";
import { html, parse } from "diff2html";
import "diff2html/bundles/css/diff2html.min.css";

interface DiffViewerProps {
  diff: string;
  outputFormat?: "line-by-line" | "side-by-side";
}

export default function DiffViewer({ diff, outputFormat = "line-by-line" }: DiffViewerProps) {
  const rendered = useMemo(() => {
    if (!diff) return "";
    const parsed = parse(diff);
    return html(parsed, {
      drawFileList: false,
      matching: "lines",
      outputFormat,
    });
  }, [diff, outputFormat]);

  if (!diff) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-sm text-muted-foreground">No diff available</p>
      </div>
    );
  }

  return (
    <div
      className="overflow-x-auto font-mono text-2xs sm:text-xs"
      dangerouslySetInnerHTML={{ __html: rendered }}
    />
  );
}
