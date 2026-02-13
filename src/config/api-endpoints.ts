export const API_ENDPOINTS = {
  // Repo
  REPO_VALIDATE: "/git/repo",
  REPO_INFO: "/git/repo",

  // Commits
  COMMITS_LIST: "/git/commits",
  COMMIT_DETAIL: (hash: string) => `/git/commits/${hash}`,

  // Diff
  DIFF: "/git/diff",

  // Operations
  RESET: "/git/reset",
  CHERRY_PICK: "/git/cherry-pick",
  REVERT: "/git/revert",

  // Branches
  BRANCHES: "/git/branches",
  BRANCHES_CHECKOUT: "/git/branches/checkout",
  BRANCHES_MERGE: "/git/branches/merge",

  // Status
  STATUS: "/git/status",

  // Browse
  BROWSE: "/git/browse",
} as const;
