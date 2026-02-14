"use client";

import { useMode } from "@/hooks/use-mode";

export function useRepo() {
  const { githubOwner, githubRepoName } = useMode();
  return { githubOwner, githubRepoName };
}
