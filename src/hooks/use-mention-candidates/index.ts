"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { useRepo } from "@/hooks/use-repo";
import type { MentionCategory, MentionItem } from "@/lib/mentions/types";
import { MENTION_MAX_ITEMS_PER_CATEGORY } from "@/config/constants";
import * as githubService from "@/services/frontend/github.services";
import * as mentionService from "@/services/frontend/mention.services";

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

export function useMentionCandidates(category: MentionCategory | null, search: string) {
  const { githubOwner, githubRepoName } = useRepo();
  const owner = githubOwner;
  const repo = githubRepoName;

  // Debounce search to avoid flooding API on every keystroke (rerender-use-ref-transient-values)
  const debouncedSearch = useDebouncedValue(search, 300);

  // Allow fetching when: specific category selected, OR cross-category search with non-empty query
  const shouldFetch = category !== null || debouncedSearch.length > 0;

  const key = shouldFetch
    ? ["mention-candidates", category ?? "all", owner, repo, debouncedSearch]
    : null;

  const { data, isLoading, error } = useSWR<MentionItem[]>(
    key,
    async () => {
      const s = debouncedSearch;

      // Cross-category search: fetch from all categories in parallel (async-parallel)
      if (category === null && s) {
        const limit = 10;
        const fetchers: Promise<MentionItem[]>[] = [
          fetchFiles(owner, repo, s).then((r) => r.slice(0, limit)),
          fetchCommits(owner, repo, s).then((r) => r.slice(0, limit)),
          fetchBranches(owner, repo, s).then((r) => r.slice(0, limit)),
          fetchTags(owner, repo, s).then((r) => r.slice(0, limit)),
          fetchRepositories(s).then((r) => r.slice(0, limit)),
        ];
        const results = await Promise.allSettled(fetchers);
        return results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
      }

      if (!category) return [];

      switch (category) {
        case "file":
          return fetchFiles(owner, repo, s);
        case "commit":
          return fetchCommits(owner, repo, s);
        case "branch":
          return fetchBranches(owner, repo, s);
        case "tag":
          return fetchTags(owner, repo, s);
        case "repository":
          return fetchRepositories(s);
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

// Module-level cache for repos list (js-cache-function-results)
let reposCachePromise: Promise<Awaited<ReturnType<typeof githubService.getGitHubRepos>>> | null = null;

async function fetchRepositories(
  search: string
): Promise<MentionItem[]> {
  if (!reposCachePromise) {
    reposCachePromise = githubService.getGitHubRepos();
    // Invalidate cache after 60s so fresh data is fetched on next search
    setTimeout(() => { reposCachePromise = null; }, 60_000);
  }
  const repos = await reposCachePromise;
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
