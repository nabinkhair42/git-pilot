"use client";

/**
 * Data hooks that fetch from GitHub API based on current repo context.
 */

import useSWR from "swr";
import { useRepo } from "@/hooks/use-repo";
import * as ghService from "@/services/frontend/github.services";
import type { CommitInfo, CommitDetail, BranchInfo, TagInfo, DiffResult } from "@/types/git";

function useGitHubParams() {
  const { githubOwner, githubRepoName } = useRepo();
  return { owner: githubOwner, repo: githubRepoName };
}

// ─── Commits ────────────────────────────────────────────────────────────────

export function useUnifiedCommits(opts?: {
  branch?: string;
  maxCount?: number;
  skip?: number;
  search?: string;
  author?: string;
}) {
  const { owner, repo } = useGitHubParams();

  const result = useSWR(
    owner && repo
      ? ["github-commits", owner, repo, JSON.stringify(opts)]
      : null,
    async () => {
      const commits = await ghService.getGitHubCommits(owner!, repo!, {
        branch: opts?.branch,
        maxCount: opts?.maxCount,
      });
      return { commits, total: commits.length };
    }
  );

  return {
    data: result.data as { commits: CommitInfo[]; total: number } | undefined,
    isLoading: result.isLoading,
    error: result.error,
    mutate: result.mutate,
  };
}

export function useUnifiedCommitDetail(hash: string | null) {
  const { owner, repo } = useGitHubParams();

  const result = useSWR(
    owner && repo && hash
      ? ["github-commit-detail", owner, repo, hash]
      : null,
    () => ghService.getGitHubCommitDetail(owner!, repo!, hash!)
  );

  return {
    data: result.data as CommitDetail | undefined,
    isLoading: result.isLoading,
    error: result.error,
  };
}

// ─── Branches ───────────────────────────────────────────────────────────────

export function useUnifiedBranches() {
  const { owner, repo } = useGitHubParams();

  const result = useSWR(
    owner && repo
      ? ["github-branches", owner, repo]
      : null,
    async () => {
      const branches = await ghService.getGitHubBranches(owner!, repo!);
      return { branches };
    }
  );

  return {
    data: result.data as { branches: BranchInfo[] } | undefined,
    isLoading: result.isLoading,
    error: result.error,
    mutate: result.mutate,
  };
}

// ─── Tags ───────────────────────────────────────────────────────────────────

export function useUnifiedTags() {
  const { owner, repo } = useGitHubParams();

  const result = useSWR(
    owner && repo
      ? ["github-tags", owner, repo]
      : null,
    async () => {
      const tags = await ghService.getGitHubTags(owner!, repo!);
      return { tags };
    }
  );

  return {
    data: result.data as { tags: TagInfo[] } | undefined,
    isLoading: result.isLoading,
    error: result.error,
  };
}

// ─── Diff ───────────────────────────────────────────────────────────────────

export function useUnifiedDiff(from: string | null, to: string | null) {
  const { owner, repo } = useGitHubParams();

  const result = useSWR(
    owner && repo && from && to
      ? ["github-diff", owner, repo, from, to]
      : null,
    () => ghService.getGitHubDiff(owner!, repo!, from!, to!)
  );

  return {
    data: result.data as DiffResult | undefined,
    isLoading: result.isLoading,
    error: result.error,
  };
}
