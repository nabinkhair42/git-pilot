export const GITHUB_API_ENDPOINTS = {
  REPOS: "/github/repos",
  COMMITS: "/github/commits",
  COMMIT_DETAIL: (hash: string) => `/github/commits/${hash}`,
  BRANCHES: "/github/branches",
  TAGS: "/github/tags",
  DIFF: "/github/diff",
} as const;
