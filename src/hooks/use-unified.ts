"use client";

/**
 * Unified data hooks that transparently delegate to either
 * local git hooks or GitHub API hooks based on the current repo mode.
 */

import useSWR from "swr";
import { useRepo } from "@/hooks/use-repo";
import { useCommits, useCommitDetail, useBranches, useTags, useDiff } from "@/hooks/use-git";
import * as ghService from "@/services/frontend/github.services";
import type { CommitInfo, CommitDetail, BranchInfo, TagInfo, DiffResult } from "@/lib/git/types";

function useIsGitHub() {
  const { mode } = useRepo();
  return mode === "github";
}

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
  const isGitHub = useIsGitHub();
  const { owner, repo } = useGitHubParams();

  // Local
  const local = useCommits(isGitHub ? undefined : opts);

  // GitHub
  const github = useSWR(
    isGitHub && owner && repo
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

  if (isGitHub) {
    return {
      data: github.data as { commits: CommitInfo[]; total: number } | undefined,
      isLoading: github.isLoading,
      error: github.error,
      mutate: github.mutate,
    };
  }

  return {
    data: local.data as { commits: CommitInfo[]; total: number } | undefined,
    isLoading: local.isLoading,
    error: local.error,
    mutate: local.mutate,
  };
}

export function useUnifiedCommitDetail(hash: string | null) {
  const isGitHub = useIsGitHub();
  const { owner, repo } = useGitHubParams();

  const local = useCommitDetail(isGitHub ? null : hash);

  const github = useSWR(
    isGitHub && owner && repo && hash
      ? ["github-commit-detail", owner, repo, hash]
      : null,
    () => ghService.getGitHubCommitDetail(owner!, repo!, hash!)
  );

  if (isGitHub) {
    return {
      data: github.data as CommitDetail | undefined,
      isLoading: github.isLoading,
      error: github.error,
    };
  }

  return {
    data: local.data as CommitDetail | undefined,
    isLoading: local.isLoading,
    error: local.error,
  };
}

// ─── Branches ───────────────────────────────────────────────────────────────

export function useUnifiedBranches() {
  const isGitHub = useIsGitHub();
  const { owner, repo } = useGitHubParams();

  const local = useBranches();

  const github = useSWR(
    isGitHub && owner && repo
      ? ["github-branches", owner, repo]
      : null,
    async () => {
      const branches = await ghService.getGitHubBranches(owner!, repo!);
      return { branches };
    }
  );

  if (isGitHub) {
    return {
      data: github.data as { branches: BranchInfo[] } | undefined,
      isLoading: github.isLoading,
      error: github.error,
      mutate: github.mutate,
    };
  }

  return {
    data: local.data as { branches: BranchInfo[] } | undefined,
    isLoading: local.isLoading,
    error: local.error,
    mutate: local.mutate,
  };
}

// ─── Tags ───────────────────────────────────────────────────────────────────

export function useUnifiedTags() {
  const isGitHub = useIsGitHub();
  const { owner, repo } = useGitHubParams();

  const local = useTags();

  const github = useSWR(
    isGitHub && owner && repo
      ? ["github-tags", owner, repo]
      : null,
    async () => {
      const tags = await ghService.getGitHubTags(owner!, repo!);
      return { tags };
    }
  );

  if (isGitHub) {
    return {
      data: github.data as { tags: TagInfo[] } | undefined,
      isLoading: github.isLoading,
      error: github.error,
    };
  }

  return {
    data: local.data as { tags: TagInfo[] } | undefined,
    isLoading: local.isLoading,
    error: local.error,
  };
}

// ─── Diff ───────────────────────────────────────────────────────────────────

export function useUnifiedDiff(from: string | null, to: string | null) {
  const isGitHub = useIsGitHub();
  const { owner, repo } = useGitHubParams();

  const local = useDiff(isGitHub ? null : from, isGitHub ? null : to);

  const github = useSWR(
    isGitHub && owner && repo && from && to
      ? ["github-diff", owner, repo, from, to]
      : null,
    () => ghService.getGitHubDiff(owner!, repo!, from!, to!)
  );

  if (isGitHub) {
    return {
      data: github.data as DiffResult | undefined,
      isLoading: github.isLoading,
      error: github.error,
    };
  }

  return {
    data: local.data as DiffResult | undefined,
    isLoading: local.isLoading,
    error: local.error,
  };
}
