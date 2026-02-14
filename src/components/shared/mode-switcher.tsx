"use client";

import { useMode } from "@/hooks/use-mode";
import { FolderGit2 } from "lucide-react";
import { GitHub } from "../icons/github";

export const ModeSwitcher = () => {
  const { mode, setMode } = useMode();

  return (
    <div className="mx-auto mb-8 flex w-full max-w-xs items-center rounded-lg border border-border bg-muted/50 p-1">
      <button
        type="button"
        onClick={() => setMode("local")}
        className={`flex flex-1 items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-all sm:gap-2 sm:text-sm ${
          mode === "local"
            ? "bg-background text-foreground  border"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <FolderGit2 className="size-3.5 sm:size-4" />
        <span>Local</span>
      </button>
      <button
        type="button"
        onClick={() => setMode("github")}
        className={`flex flex-1 items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-all sm:gap-2 sm:text-sm ${
          mode === "github"
            ? "bg-background text-foreground  border"
            : "text-muted-foreground hover:text-foreground"
        }`}
      >
        <GitHub className="size-3.5 sm:size-4" />
        <span>GitHub</span>
      </button>
    </div>
  );
};