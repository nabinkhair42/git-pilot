"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

export type AppMode = "local" | "github";

interface GitHubRepo {
  owner: string;
  name: string;
  fullName: string;
  defaultBranch: string;
  isPrivate: boolean;
}

interface ModeContextValue {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  githubRepo: GitHubRepo | null;
  setGitHubRepo: (repo: GitHubRepo | null) => void;
  isGitHubMode: boolean;
}

const ModeContext = createContext<ModeContextValue>({
  mode: "local",
  setMode: () => {},
  githubRepo: null,
  setGitHubRepo: () => {},
  isGitHubMode: false,
});

export function ModeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<AppMode>("local");
  const [githubRepo, setGitHubRepo] = useState<GitHubRepo | null>(null);

  const setMode = useCallback((newMode: AppMode) => {
    setModeState(newMode);
    if (newMode === "local") {
      setGitHubRepo(null);
    }
  }, []);

  return (
    <ModeContext.Provider
      value={{
        mode,
        setMode,
        githubRepo,
        setGitHubRepo,
        isGitHubMode: mode === "github",
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
