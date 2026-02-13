import api from "@/config/axios";
import { API_ENDPOINTS } from "@/config/api-endpoints";
import type {
  RepoInfo,
  CommitInfo,
  CommitDetail,
  BranchInfo,
  StatusInfo,
  DiffResult,
  OperationResult,
  ResetMode,
  StashEntry,
  TagInfo,
} from "@/lib/git/types";

function unwrap<T>(res: { data: { success: boolean; data: T } }): T {
  return res.data.data;
}

// Repo
export async function validateRepo(path: string) {
  return unwrap<{ valid: boolean; path: string }>(
    await api.post(API_ENDPOINTS.REPO_VALIDATE, { path })
  );
}

export async function getRepoInfo(path: string) {
  return unwrap<RepoInfo>(
    await api.get(API_ENDPOINTS.REPO_INFO, { params: { path } })
  );
}

// Commits
export async function getCommits(
  path: string,
  opts?: {
    branch?: string;
    maxCount?: number;
    skip?: number;
    search?: string;
    author?: string;
  }
) {
  return unwrap<{ commits: CommitInfo[]; total: number }>(
    await api.get(API_ENDPOINTS.COMMITS_LIST, { params: { path, ...opts } })
  );
}

export async function getCommitDetail(path: string, hash: string) {
  return unwrap<CommitDetail>(
    await api.get(API_ENDPOINTS.COMMIT_DETAIL(hash), { params: { path } })
  );
}

// Diff
export async function getDiff(path: string, from: string, to: string) {
  return unwrap<DiffResult>(
    await api.get(API_ENDPOINTS.DIFF, { params: { path, from, to } })
  );
}

// Operations
export async function resetToCommit(path: string, hash: string, mode: ResetMode) {
  return unwrap<OperationResult>(
    await api.post(API_ENDPOINTS.RESET, { path, hash, mode })
  );
}

export async function cherryPickCommits(path: string, hashes: string[]) {
  return unwrap<OperationResult>(
    await api.post(API_ENDPOINTS.CHERRY_PICK, { path, hashes })
  );
}

export async function revertCommits(path: string, hashes: string[]) {
  return unwrap<OperationResult>(
    await api.post(API_ENDPOINTS.REVERT, { path, hashes })
  );
}

// Branches
export async function getBranches(path: string) {
  return unwrap<{ branches: BranchInfo[] }>(
    await api.get(API_ENDPOINTS.BRANCHES, { params: { path } })
  );
}

export async function createBranch(path: string, name: string, startPoint?: string) {
  return unwrap<OperationResult>(
    await api.post(API_ENDPOINTS.BRANCHES, { path, name, startPoint })
  );
}

export async function deleteBranch(path: string, name: string, force?: boolean) {
  return unwrap<OperationResult>(
    await api.delete(API_ENDPOINTS.BRANCHES, { data: { path, name, force } })
  );
}

export async function deleteRemoteBranch(path: string, name: string) {
  return unwrap<OperationResult>(
    await api.delete(API_ENDPOINTS.BRANCHES, { data: { path, name, isRemote: true } })
  );
}

export async function checkoutBranch(path: string, name: string) {
  return unwrap<OperationResult>(
    await api.post(API_ENDPOINTS.BRANCHES_CHECKOUT, { path, name })
  );
}

export async function mergeBranch(path: string, source: string) {
  return unwrap<OperationResult>(
    await api.post(API_ENDPOINTS.BRANCHES_MERGE, { path, source })
  );
}

// Status
export async function getStatus(path: string) {
  return unwrap<StatusInfo>(
    await api.get(API_ENDPOINTS.STATUS, { params: { path } })
  );
}

// Browse
export interface DirSuggestion {
  path: string;
  name: string;
  isGitRepo: boolean;
}

export async function browsePath(partial: string) {
  return unwrap<{ suggestions: DirSuggestion[] }>(
    await api.get(API_ENDPOINTS.BROWSE, { params: { path: partial } })
  );
}

// Stash
export async function getStashList(path: string) {
  return unwrap<{ stashes: StashEntry[] }>(
    await api.get(API_ENDPOINTS.STASH, { params: { path } })
  );
}

export async function stashSave(path: string, message?: string, includeUntracked?: boolean) {
  return unwrap<OperationResult>(
    await api.post(API_ENDPOINTS.STASH, { path, action: "save", message, includeUntracked })
  );
}

export async function stashApply(path: string, index: number) {
  return unwrap<OperationResult>(
    await api.post(API_ENDPOINTS.STASH, { path, action: "apply", index })
  );
}

export async function stashPop(path: string, index: number) {
  return unwrap<OperationResult>(
    await api.post(API_ENDPOINTS.STASH, { path, action: "pop", index })
  );
}

export async function stashDrop(path: string, index: number) {
  return unwrap<OperationResult>(
    await api.post(API_ENDPOINTS.STASH, { path, action: "drop", index })
  );
}

export async function stashClear(path: string) {
  return unwrap<OperationResult>(
    await api.post(API_ENDPOINTS.STASH, { path, action: "clear" })
  );
}

// Tags
export async function getTags(path: string) {
  return unwrap<{ tags: TagInfo[] }>(
    await api.get(API_ENDPOINTS.TAGS, { params: { path } })
  );
}

export async function createTag(path: string, name: string, message?: string, hash?: string) {
  return unwrap<OperationResult>(
    await api.post(API_ENDPOINTS.TAGS, { path, name, message, hash })
  );
}

export async function deleteTag(path: string, name: string) {
  return unwrap<OperationResult>(
    await api.delete(API_ENDPOINTS.TAGS, { data: { path, name } })
  );
}
