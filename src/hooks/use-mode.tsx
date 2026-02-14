"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

interface GitHubRepo {
  owner: string;
  name: string;
  fullName: string;
  defaultBranch: string;
  isPrivate: boolean;
}

interface ModeContextValue {
  githubRepo: GitHubRepo | null;
  setGitHubRepo: (repo: GitHubRepo | null) => void;
  isGitHubMode: boolean;
}

const ModeContext = createContext<ModeContextValue>({
  githubRepo: null,
  setGitHubRepo: () => {},
  isGitHubMode: false,
});

export function ModeProvider({ children }: { children: ReactNode }) {
  const [githubRepo, setGitHubRepo] = useState<GitHubRepo | null>(null);

  return (
    <ModeContext.Provider
      value={{
        githubRepo,
        setGitHubRepo,
        isGitHubMode: githubRepo !== null,
      }}
    >
      {children}
    </ModeContext.Provider>
  );
}

export function useMode() {
  return useContext(ModeContext);
}

export type { GitHubRepo };
