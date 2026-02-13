"use client";

import {
  createContext,
  useContext,
} from "react";
import type { AppMode } from "@/hooks/use-mode";

interface RepoContextValue {
  repoPath: string | null;
  mode: AppMode;
  githubOwner: string | null;
  githubRepoName: string | null;
}

export const RepoContext = createContext<RepoContextValue>({
  repoPath: null,
  mode: "local",
  githubOwner: null,
  githubRepoName: null,
});

export function useRepo() {
  return useContext(RepoContext);
}
