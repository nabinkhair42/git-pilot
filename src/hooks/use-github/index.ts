"use client";

import useSWR from "swr";
import * as ghService from "@/services/frontend/github.services";
import { useMode } from "@/hooks/use-mode";

function useGitHubRepo() {
  const { githubRepo } = useMode();
  return githubRepo;
}

export function useGitHubRepos() {
  const { isGitHubMode } = useMode();
  return useSWR(
    isGitHubMode ? ["github-repos"] : null,
    () => ghService.getGitHubRepos()
  );
}

export function useGitHubRepoInfo() {
  const repo = useGitHubRepo();
  return useSWR(
    repo ? ["github-repo-info", repo.owner, repo.name] : null,
    () => ghService.getGitHubRepoInfo(repo!.owner, repo!.name)
  );
}

export function useGitHubCommits(opts?: {
  branch?: string;
  maxCount?: number;
}) {
  const repo = useGitHubRepo();
  return useSWR(
    repo ? ["github-commits", repo.owner, repo.name, JSON.stringify(opts)] : null,
    () => ghService.getGitHubCommits(repo!.owner, repo!.name, opts)
  );
}

export function useGitHubCommitDetail(hash: string | null) {
  const repo = useGitHubRepo();
  return useSWR(
    repo && hash ? ["github-commit-detail", repo.owner, repo.name, hash] : null,
    () => ghService.getGitHubCommitDetail(repo!.owner, repo!.name, hash!)
  );
}

export function useGitHubBranches() {
  const repo = useGitHubRepo();
  return useSWR(
    repo ? ["github-branches", repo.owner, repo.name] : null,
    () => ghService.getGitHubBranches(repo!.owner, repo!.name)
  );
}

export function useGitHubTags() {
  const repo = useGitHubRepo();
  return useSWR(
    repo ? ["github-tags", repo.owner, repo.name] : null,
    () => ghService.getGitHubTags(repo!.owner, repo!.name)
  );
}

export function useGitHubDiff(from: string | null, to: string | null) {
  const repo = useGitHubRepo();
  return useSWR(
    repo && from && to
      ? ["github-diff", repo.owner, repo.name, from, to]
      : null,
    () => ghService.getGitHubDiff(repo!.owner, repo!.name, from!, to!)
  );
}
