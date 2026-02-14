"use client";

import {
  createContext,
  useContext,
} from "react";

interface RepoContextValue {
  githubOwner: string | null;
  githubRepoName: string | null;
}

export const RepoContext = createContext<RepoContextValue>({
  githubOwner: null,
  githubRepoName: null,
});

export function useRepo() {
  return useContext(RepoContext);
}
