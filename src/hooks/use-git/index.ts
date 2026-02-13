"use client";

import useSWR, { mutate } from "swr";
import * as gitService from "@/services/frontend/git.services";
import type { ResetMode } from "@/lib/git/types";
import { useRepo } from "@/hooks/use-repo";
import { STATUS_REFRESH_INTERVAL } from "@/config/constants";

function useRepoPath() {
  const { repoPath, mode } = useRepo();
  // Only return the path if we're in local mode
  if (mode === "github") return null;
  return repoPath;
}

export function useRepoInfo() {
  const path = useRepoPath();
  return useSWR(
    path ? ["repo-info", path] : null,
    () => gitService.getRepoInfo(path!)
  );
}

export function useCommits(opts?: {
  branch?: string;
  maxCount?: number;
  skip?: number;
  search?: string;
  author?: string;
}) {
  const path = useRepoPath();
  return useSWR(
    path ? ["commits", path, JSON.stringify(opts)] : null,
    () => gitService.getCommits(path!, opts)
  );
}

export function useCommitDetail(hash: string | null) {
  const path = useRepoPath();
  return useSWR(
    path && hash ? ["commit-detail", path, hash] : null,
    () => gitService.getCommitDetail(path!, hash!)
  );
}

export function useBranches() {
  const path = useRepoPath();
  return useSWR(
    path ? ["branches", path] : null,
    () => gitService.getBranches(path!)
  );
}

export function useStatus() {
  const path = useRepoPath();
  return useSWR(
    path ? ["status", path] : null,
    () => gitService.getStatus(path!),
    { refreshInterval: STATUS_REFRESH_INTERVAL }
  );
}

export function useDiff(from: string | null, to: string | null) {
  const path = useRepoPath();
  return useSWR(
    path && from && to ? ["diff", path, from, to] : null,
    () => gitService.getDiff(path!, from!, to!)
  );
}

export function useStashList() {
  const path = useRepoPath();
  return useSWR(
    path ? ["stash", path] : null,
    () => gitService.getStashList(path!)
  );
}

export function useTags() {
  const path = useRepoPath();
  return useSWR(
    path ? ["tags", path] : null,
    () => gitService.getTags(path!)
  );
}

export function useGitMutations() {
  const path = useRepoPath();

  async function invalidateAll() {
    if (!path) return;
    await mutate(
      (key: unknown) => Array.isArray(key) && key[1] === path,
      undefined,
      { revalidate: true }
    );
  }

  return {
    async reset(hash: string, mode: ResetMode) {
      if (!path) throw new Error("No repo path");
      const result = await gitService.resetToCommit(path, hash, mode);
      if (result.success) await invalidateAll();
      return result;
    },

    async cherryPick(hashes: string[]) {
      if (!path) throw new Error("No repo path");
      const result = await gitService.cherryPickCommits(path, hashes);
      if (result.success) await invalidateAll();
      return result;
    },

    async revert(hashes: string[]) {
      if (!path) throw new Error("No repo path");
      const result = await gitService.revertCommits(path, hashes);
      if (result.success) await invalidateAll();
      return result;
    },

    async createBranch(name: string, startPoint?: string) {
      if (!path) throw new Error("No repo path");
      const result = await gitService.createBranch(path, name, startPoint);
      if (result.success) await invalidateAll();
      return result;
    },

    async deleteBranch(name: string, force?: boolean) {
      if (!path) throw new Error("No repo path");
      const result = await gitService.deleteBranch(path, name, force);
      if (result.success) await invalidateAll();
      return result;
    },

    async deleteRemoteBranch(name: string) {
      if (!path) throw new Error("No repo path");
      const result = await gitService.deleteRemoteBranch(path, name);
      if (result.success) await invalidateAll();
      return result;
    },

    async checkoutBranch(name: string) {
      if (!path) throw new Error("No repo path");
      const result = await gitService.checkoutBranch(path, name);
      if (result.success) await invalidateAll();
      return result;
    },

    async mergeBranch(source: string) {
      if (!path) throw new Error("No repo path");
      const result = await gitService.mergeBranch(path, source);
      if (result.success) await invalidateAll();
      return result;
    },

    // Stash
    async stashSave(message?: string, includeUntracked?: boolean) {
      if (!path) throw new Error("No repo path");
      const result = await gitService.stashSave(path, message, includeUntracked);
      if (result.success) await invalidateAll();
      return result;
    },

    async stashApply(index: number) {
      if (!path) throw new Error("No repo path");
      const result = await gitService.stashApply(path, index);
      if (result.success) await invalidateAll();
      return result;
    },

    async stashPop(index: number) {
      if (!path) throw new Error("No repo path");
      const result = await gitService.stashPop(path, index);
      if (result.success) await invalidateAll();
      return result;
    },

    async stashDrop(index: number) {
      if (!path) throw new Error("No repo path");
      const result = await gitService.stashDrop(path, index);
      if (result.success) await invalidateAll();
      return result;
    },

    async stashClear() {
      if (!path) throw new Error("No repo path");
      const result = await gitService.stashClear(path);
      if (result.success) await invalidateAll();
      return result;
    },

    // Tags
    async createTag(name: string, message?: string, hash?: string) {
      if (!path) throw new Error("No repo path");
      const result = await gitService.createTag(path, name, message, hash);
      if (result.success) await invalidateAll();
      return result;
    },

    async deleteTag(name: string) {
      if (!path) throw new Error("No repo path");
      const result = await gitService.deleteTag(path, name);
      if (result.success) await invalidateAll();
      return result;
    },
  };
}
