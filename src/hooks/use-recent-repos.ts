"use client";

import { MAX_RECENT_REPOS, STORAGE_KEY } from "@/config/constants";
import { useState, useEffect, useCallback } from "react";

export function useRecentRepos() {
  const [repos, setRepos] = useState<string[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setRepos(JSON.parse(stored));
    } catch {
      // ignore
    }
  }, []);

  const addRepo = useCallback((path: string) => {
    setRepos((prev) => {
      const filtered = prev.filter((r) => r !== path);
      const next = [path, ...filtered].slice(0, MAX_RECENT_REPOS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  const removeRepo = useCallback((path: string) => {
    setRepos((prev) => {
      const next = prev.filter((r) => r !== path);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }, []);

  return { repos, addRepo, removeRepo };
}
