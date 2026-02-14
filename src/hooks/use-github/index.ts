"use client";

import useSWR from "swr";
import * as ghService from "@/services/frontend/github.services";
import { useMode } from "@/hooks/use-mode";

function useGitHubRepo() {
  const { githubRepo } = useMode();
  return githubRepo;
}

export function useGitHubRepos() {
  return useSWR(
    ["github-repos"],
    () => ghService.getGitHubRepos()
  );
}

export function useGitHubMutations() {
  const repo = useGitHubRepo();

  async function deleteBranch(name: string) {
    if (!repo) return { success: false, message: "No repo selected" };
    try {
      const result = await ghService.deleteGitHubBranch(repo.owner, repo.name, name);
      return { success: true, message: result.message || `Branch "${name}" deleted` };
    } catch (e) {
      return { success: false, message: e instanceof Error ? e.message : "Delete failed" };
    }
  }

  async function cherryPick(hashes: string[], branch: string) {
    if (!repo) return { success: false, message: "No repo selected" };
    try {
      let lastResult = { success: true, message: "" };
      for (const hash of hashes) {
        lastResult = await ghService.cherryPickGitHubCommit(repo.owner, repo.name, branch, hash);
      }
      return { success: true, message: lastResult.message || "Cherry-pick successful" };
    } catch (e) {
      return { success: false, message: e instanceof Error ? e.message : "Cherry-pick failed" };
    }
  }

  async function revert(hashes: string[], branch: string) {
    if (!repo) return { success: false, message: "No repo selected" };
    try {
      let lastResult = { success: true, message: "" };
      for (const hash of hashes) {
        lastResult = await ghService.revertGitHubCommit(repo.owner, repo.name, branch, hash);
      }
      return { success: true, message: lastResult.message || "Revert successful" };
    } catch (e) {
      return { success: false, message: e instanceof Error ? e.message : "Revert failed" };
    }
  }

  async function reset(hash: string, branch: string) {
    if (!repo) return { success: false, message: "No repo selected" };
    try {
      const result = await ghService.resetGitHubBranch(repo.owner, repo.name, branch, hash);
      return { success: true, message: result.message || "Reset successful" };
    } catch (e) {
      return { success: false, message: e instanceof Error ? e.message : "Reset failed" };
    }
  }

  return { deleteBranch, cherryPick, revert, reset };
}
