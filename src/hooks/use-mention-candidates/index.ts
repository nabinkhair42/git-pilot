"use client";

import useSWR from "swr";
import { useRepo } from "@/hooks/use-repo";
import type { MentionCategory, MentionItem } from "@/lib/mentions/types";
import { MENTION_MAX_ITEMS_PER_CATEGORY } from "@/config/constants";
import * as githubService from "@/services/frontend/github.services";
import * as mentionService from "@/services/frontend/mention.services";

export function useMentionCandidates(category: MentionCategory | null, search: string) {
  const { githubOwner, githubRepoName } = useRepo();
  const owner = githubOwner;
  const repo = githubRepoName;

  // Allow fetching when: specific category selected, OR cross-category search with non-empty query
  const shouldFetch = category !== null || search.length > 0;

  const key = shouldFetch
    ? ["mention-candidates", category ?? "all", owner, repo, search]
    : null;

  const { data, isLoading, error } = useSWR<MentionItem[]>(
    key,
    async () => {
      // Cross-category search: fetch from all categories in parallel
      if (category === null && search) {
        const limit = 10;
        const fetchers: Promise<MentionItem[]>[] = [
          fetchFiles(owner, repo, search).then((r) => r.slice(0, limit)),
          fetchCommits(owner, repo, search).then((r) => r.slice(0, limit)),
          fetchBranches(owner, repo, search).then((r) => r.slice(0, limit)),
          fetchTags(owner, repo, search).then((r) => r.slice(0, limit)),
          fetchRepositories(search).then((r) => r.slice(0, limit)),
        ];
        const results = await Promise.allSettled(fetchers);
        return results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
      }

      if (!category) return [];

      switch (category) {
        case "file":
          return fetchFiles(owner, repo, search);
        case "commit":
          return fetchCommits(owner, repo, search);
        case "branch":
          return fetchBranches(owner, repo, search);
        case "tag":
          return fetchTags(owner, repo, search);
        case "repository":
          return fetchRepositories(search);
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
  owner: string | null,
  repo: string | null,
  search: string
): Promise<MentionItem[]> {
  if (!owner || !repo) return [];
  const result = await mentionService.getGitHubFileList(owner, repo, search || undefined);
  return result.files.slice(0, MENTION_MAX_ITEMS_PER_CATEGORY).map((f) => ({
    id: `file:${f}`,
    category: "file",
    label: f.split("/").pop() || f,
    description: f,
    value: f,
  }));
}

async function fetchCommits(
  owner: string | null,
  repo: string | null,
  search: string
): Promise<MentionItem[]> {
  if (!owner || !repo) return [];
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

async function fetchBranches(
  owner: string | null,
  repo: string | null,
  search: string
): Promise<MentionItem[]> {
  if (!owner || !repo) return [];
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

async function fetchTags(
  owner: string | null,
  repo: string | null,
  search: string
): Promise<MentionItem[]> {
  if (!owner || !repo) return [];
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

async function fetchRepositories(
  search: string
): Promise<MentionItem[]> {
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
