import api from "@/config/axios";
import { GITHUB_API_ENDPOINTS } from "@/config/github-endpoints";
import type {
  CommitInfo,
  CommitDetail,
  BranchInfo,
  DiffResult,
  TagInfo,
} from "@/types/git";

function unwrap<T>(res: { data: { success: boolean; data: T } }): T {
  return res.data.data;
}

// ─── Repos ──────────────────────────────────────────────────────────────────

interface GitHubRepoItem {
  owner: string;
  name: string;
  fullName: string;
  defaultBranch: string;
  isPrivate: boolean;
  description: string | null;
  language: string | null;
  updatedAt: string | null;
  stargazersCount: number;
  url: string;
}

export async function getGitHubRepos() {
  return unwrap<GitHubRepoItem[]>(
    await api.get(GITHUB_API_ENDPOINTS.REPOS)
  );
}

// ─── Commits ────────────────────────────────────────────────────────────────

export async function getGitHubCommits(
  owner: string,
  repo: string,
  opts?: { branch?: string; maxCount?: number }
) {
  return unwrap<CommitInfo[]>(
    await api.get(GITHUB_API_ENDPOINTS.COMMITS, {
      params: { owner, repo, ...opts },
    })
  );
}

export async function getGitHubCommitDetail(
  owner: string,
  repo: string,
  hash: string
) {
  return unwrap<CommitDetail>(
    await api.get(GITHUB_API_ENDPOINTS.COMMIT_DETAIL(hash), {
      params: { owner, repo },
    })
  );
}

// ─── Branches ───────────────────────────────────────────────────────────────

export async function getGitHubBranches(owner: string, repo: string) {
  return unwrap<BranchInfo[]>(
    await api.get(GITHUB_API_ENDPOINTS.BRANCHES, {
      params: { owner, repo },
    })
  );
}

export async function deleteGitHubBranch(owner: string, repo: string, name: string) {
  return unwrap<{ success: boolean; message: string }>(
    await api.delete(GITHUB_API_ENDPOINTS.BRANCHES, {
      data: { owner, repo, name },
    })
  );
}

// ─── Tags ───────────────────────────────────────────────────────────────────

export async function getGitHubTags(owner: string, repo: string) {
  return unwrap<TagInfo[]>(
    await api.get(GITHUB_API_ENDPOINTS.TAGS, {
      params: { owner, repo },
    })
  );
}

// ─── Diff / Compare ────────────────────────────────────────────────────────

export async function getGitHubDiff(
  owner: string,
  repo: string,
  from: string,
  to: string
) {
  return unwrap<DiffResult>(
    await api.get(GITHUB_API_ENDPOINTS.DIFF, {
      params: { owner, repo, from, to },
    })
  );
}

// ─── Operations ─────────────────────────────────────────────────────────────

export async function cherryPickGitHubCommit(
  owner: string,
  repo: string,
  branch: string,
  hash: string
) {
  return unwrap<{ success: boolean; message: string }>(
    await api.post(GITHUB_API_ENDPOINTS.CHERRY_PICK, { owner, repo, branch, hash })
  );
}

export async function revertGitHubCommit(
  owner: string,
  repo: string,
  branch: string,
  hash: string
) {
  return unwrap<{ success: boolean; message: string }>(
    await api.post(GITHUB_API_ENDPOINTS.REVERT, { owner, repo, branch, hash })
  );
}

export async function resetGitHubBranch(
  owner: string,
  repo: string,
  branch: string,
  hash: string
) {
  return unwrap<{ success: boolean; message: string }>(
    await api.post(GITHUB_API_ENDPOINTS.RESET, { owner, repo, branch, hash })
  );
}

