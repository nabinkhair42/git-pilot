import api from "@/config/axios";
import { GITHUB_API_ENDPOINTS } from "@/config/github-endpoints";
import type {
  CommitInfo,
  CommitDetail,
  BranchInfo,
  StatusInfo,
  DiffResult,
  TagInfo,
} from "@/lib/git/types";

function unwrap<T>(res: { data: { success: boolean; data: T } }): T {
  return res.data.data;
}

// ─── GitHub Repo types ──────────────────────────────────────────────────────

export interface GitHubRepoItem {
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

// ─── Repos ──────────────────────────────────────────────────────────────────

export async function getGitHubRepos() {
  return unwrap<GitHubRepoItem[]>(
    await api.get(GITHUB_API_ENDPOINTS.REPOS)
  );
}

export async function getGitHubRepoInfo(owner: string, repo: string) {
  return unwrap<{
    path: string;
    currentBranch: string;
    remotes: { name: string; refs: { fetch: string; push: string } }[];
    isClean: boolean;
    headCommit: string;
  }>(await api.get(GITHUB_API_ENDPOINTS.REPOS, { params: { owner, repo } }));
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

// ─── Status (stub) ──────────────────────────────────────────────────────────

export async function getGitHubStatus(
  _owner: string,
  _repo: string
): Promise<StatusInfo> {
  // GitHub repos don't have working-tree state
  return {
    current: null,
    tracking: null,
    ahead: 0,
    behind: 0,
    staged: [],
    modified: [],
    deleted: [],
    untracked: [],
    conflicted: [],
    isClean: true,
  };
}
