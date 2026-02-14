"use client";

import useSWR from "swr";
import { useRepo } from "@/hooks/use-repo";
import { useRecentRepos } from "@/hooks/use-recent-repos";
import type { MentionCategory, MentionItem } from "@/lib/mentions/types";
import { MENTION_MAX_ITEMS_PER_CATEGORY } from "@/config/constants";
import * as gitService from "@/services/frontend/git.services";
import * as githubService from "@/services/frontend/github.services";
import * as mentionService from "@/services/frontend/mention.services";

export function useMentionCandidates(category: MentionCategory | null, search: string) {
  const { mode, repoPath, githubOwner, githubRepoName } = useRepo();
  const { repos: recentRepos } = useRecentRepos();

  const key = category
    ? ["mention-candidates", category, mode, repoPath, githubOwner, githubRepoName, search]
    : null;

  const { data, isLoading, error } = useSWR<MentionItem[]>(
    key,
    async () => {
      if (!category) return [];

      switch (category) {
        case "file":
          return fetchFiles(mode, repoPath, githubOwner, githubRepoName, search);
        case "commit":
          return fetchCommits(mode, repoPath, githubOwner, githubRepoName, search);
        case "branch":
          return fetchBranches(mode, repoPath, githubOwner, githubRepoName, search);
        case "tag":
          return fetchTags(mode, repoPath, githubOwner, githubRepoName, search);
        case "stash":
          return fetchStashes(mode, repoPath, search);
        case "repository":
          return fetchRepositories(mode, recentRepos, githubOwner, githubRepoName, search);
        default:
          return [];
      }
    },
    { dedupingInterval: 2000, revalidateOnFocus: false }
  );

  return { data: data ?? [], isLoading, error };
}

// ─── Fetchers ──────────────────────────────────────────────────────────────

async function fetchFiles(
  mode: string,
  repoPath: string | null,
  owner: string | null,
  repo: string | null,
  search: string
): Promise<MentionItem[]> {
  if (mode === "local" && repoPath) {
    const result = await mentionService.getFileList(repoPath, search || undefined);
    return result.files.slice(0, MENTION_MAX_ITEMS_PER_CATEGORY).map((f) => ({
      id: `file:${f}`,
      category: "file",
      label: f.split("/").pop() || f,
      description: f,
      value: f,
    }));
  }
  if (mode === "github" && owner && repo) {
    const result = await mentionService.getGitHubFileList(owner, repo, search || undefined);
    return result.files.slice(0, MENTION_MAX_ITEMS_PER_CATEGORY).map((f) => ({
      id: `file:${f}`,
      category: "file",
      label: f.split("/").pop() || f,
      description: f,
      value: f,
    }));
  }
  return [];
}

async function fetchCommits(
  mode: string,
  repoPath: string | null,
  owner: string | null,
  repo: string | null,
  search: string
): Promise<MentionItem[]> {
  if (mode === "local" && repoPath) {
    const result = await gitService.getCommits(repoPath, {
      maxCount: MENTION_MAX_ITEMS_PER_CATEGORY,
      search: search || undefined,
    });
    return result.commits.map((c) => ({
      id: `commit:${c.hash}`,
      category: "commit",
      label: `${c.abbreviatedHash} ${c.message}`,
      description: `${c.authorName} - ${c.date}`,
      value: c.hash,
    }));
  }
  if (mode === "github" && owner && repo) {
    const commits = await githubService.getGitHubCommits(owner, repo, {
      maxCount: MENTION_MAX_ITEMS_PER_CATEGORY,
    });
    const filtered = search
      ? commits.filter(
          (c) =>
            c.message.toLowerCase().includes(search.toLowerCase()) ||
            c.hash.startsWith(search)
        )
      : commits;
    return filtered.map((c) => ({
      id: `commit:${c.hash}`,
      category: "commit",
      label: `${c.abbreviatedHash} ${c.message}`,
      description: `${c.authorName} - ${c.date}`,
      value: c.hash,
    }));
  }
  return [];
}

async function fetchBranches(
  mode: string,
  repoPath: string | null,
  owner: string | null,
  repo: string | null,
  search: string
): Promise<MentionItem[]> {
  if (mode === "local" && repoPath) {
    const result = await gitService.getBranches(repoPath);
    const filtered = search
      ? result.branches.filter((b) => b.name.toLowerCase().includes(search.toLowerCase()))
      : result.branches;
    return filtered.slice(0, MENTION_MAX_ITEMS_PER_CATEGORY).map((b) => ({
      id: `branch:${b.name}`,
      category: "branch",
      label: b.name,
      description: b.current ? "current" : undefined,
      value: b.name,
    }));
  }
  if (mode === "github" && owner && repo) {
    const branches = await githubService.getGitHubBranches(owner, repo);
    const filtered = search
      ? branches.filter((b) => b.name.toLowerCase().includes(search.toLowerCase()))
      : branches;
    return filtered.slice(0, MENTION_MAX_ITEMS_PER_CATEGORY).map((b) => ({
      id: `branch:${b.name}`,
      category: "branch",
      label: b.name,
      description: b.current ? "default" : undefined,
      value: b.name,
    }));
  }
  return [];
}

async function fetchTags(
  mode: string,
  repoPath: string | null,
  owner: string | null,
  repo: string | null,
  search: string
): Promise<MentionItem[]> {
  if (mode === "local" && repoPath) {
    const result = await gitService.getTags(repoPath);
    const filtered = search
      ? result.tags.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()))
      : result.tags;
    return filtered.slice(0, MENTION_MAX_ITEMS_PER_CATEGORY).map((t) => ({
      id: `tag:${t.name}`,
      category: "tag",
      label: t.name,
      description: t.message || undefined,
      value: t.name,
    }));
  }
  if (mode === "github" && owner && repo) {
    const tags = await githubService.getGitHubTags(owner, repo);
    const filtered = search
      ? tags.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()))
      : tags;
    return filtered.slice(0, MENTION_MAX_ITEMS_PER_CATEGORY).map((t) => ({
      id: `tag:${t.name}`,
      category: "tag",
      label: t.name,
      description: t.message || undefined,
      value: t.name,
    }));
  }
  return [];
}

async function fetchStashes(
  mode: string,
  repoPath: string | null,
  search: string
): Promise<MentionItem[]> {
  if (mode !== "local" || !repoPath) return [];

  const result = await gitService.getStashList(repoPath);
  const filtered = search
    ? result.stashes.filter((s) => s.message.toLowerCase().includes(search.toLowerCase()))
    : result.stashes;
  return filtered.slice(0, MENTION_MAX_ITEMS_PER_CATEGORY).map((s) => ({
    id: `stash:${s.index}`,
    category: "stash",
    label: `stash@{${s.index}}: ${s.message}`,
    description: s.date,
    value: String(s.index),
  }));
}

async function fetchRepositories(
  mode: string,
  recentRepos: string[],
  owner: string | null,
  repo: string | null,
  search: string
): Promise<MentionItem[]> {
  if (mode === "local") {
    const filtered = search
      ? recentRepos.filter((r) => r.toLowerCase().includes(search.toLowerCase()))
      : recentRepos;
    return filtered.slice(0, MENTION_MAX_ITEMS_PER_CATEGORY).map((r) => ({
      id: `repository:${r}`,
      category: "repository",
      label: r.split("/").pop() || r,
      description: r,
      value: r,
    }));
  }
  if (mode === "github") {
    const repos = await githubService.getGitHubRepos();
    const filtered = search
      ? repos.filter((r) => r.fullName.toLowerCase().includes(search.toLowerCase()))
      : repos;
    return filtered.slice(0, MENTION_MAX_ITEMS_PER_CATEGORY).map((r) => ({
      id: `repository:${r.fullName}`,
      category: "repository",
      label: r.fullName,
      description: r.description || undefined,
      value: r.fullName,
    }));
  }
  return [];
}
