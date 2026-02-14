"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface Shortcut {
  key: string;
  ctrl?: boolean;
  meta?: boolean;
  shift?: boolean;
  action: () => void;
  description: string;
}

export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't fire when typing in inputs
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if ((e.target as HTMLElement)?.isContentEditable) return;

      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl ? e.ctrlKey || e.metaKey : true;
        const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
        const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();

        if (ctrlMatch && shiftMatch && keyMatch) {
          e.preventDefault();
          shortcut.action();
          return;
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [shortcuts]);
}

/** Global navigation shortcuts for repo pages */
export function useRepoShortcuts() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const owner = searchParams.get("owner") || "";
  const repo = searchParams.get("repo") || "";

  function nav(route: string) {
    router.push(`${route}?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`);
  }

  useKeyboardShortcuts([
    { key: "1", description: "Go to Commits", action: () => nav("/repo/commits") },
    { key: "2", description: "Go to Branches", action: () => nav("/repo/branches") },
    { key: "3", description: "Go to Tags", action: () => nav("/repo/tags") },
    { key: "4", description: "Go to Compare", action: () => nav("/repo/compare") },
    { key: "h", description: "Go Home", action: () => router.push("/") },
  ]);
}
