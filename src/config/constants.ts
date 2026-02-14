export const APP_NAME = "Git Commit Manager";
export const DEFAULT_COMMITS_PER_PAGE = 50;
export const MAX_RECENT_REPOS = 50
export const STATUS_REFRESH_INTERVAL = 5000;
export const STORAGE_KEY = "git-commit-manager:recent-repos";

export const RESET_MODES = {
  soft: {
    label: "Soft",
    description: "Moves HEAD, keeps changes staged",
    tier: "dangerous" as const,
  },
  mixed: {
    label: "Mixed",
    description: "Moves HEAD, unstages changes",
    tier: "dangerous" as const,
  },
  hard: {
    label: "Hard",
    description: "Moves HEAD, discards all changes",
    tier: "critical" as const,
  },
} as const;

export type SafetyTier = "safe" | "moderate" | "dangerous" | "critical";

export const FILE_STATUS_LABELS: Record<string, string> = {
  A: "Added",
  M: "Modified",
  D: "Deleted",
  R: "Renamed",
  C: "Copied",
  U: "Unmerged",
};

// ─── Mentions ──────────────────────────────────────────────────────────────

export const MENTION_TRIGGER_CHAR = "@";
export const MENTION_FILE_CONTENT_MAX_CHARS = 6000;
export const MENTION_MAX_ITEMS_PER_CATEGORY = 50;

export const MENTION_CATEGORIES = [
  { id: "file" as const, label: "File", icon: "FileText", placeholder: "Search files..." },
  { id: "commit" as const, label: "Commit", icon: "GitCommitHorizontal", placeholder: "Search commits..." },
  { id: "branch" as const, label: "Branch", icon: "GitBranch", placeholder: "Search branches..." },
  { id: "tag" as const, label: "Tag", icon: "Tag", placeholder: "Search tags..." },
  { id: "stash" as const, label: "Stash", icon: "Archive", placeholder: "Search stashes..." },
  { id: "repository" as const, label: "Repository", icon: "FolderGit2", placeholder: "Search repos..." },
] as const;

export const FILE_STATUS_COLORS: Record<string, string> = {
  A: "text-git-added",
  M: "text-git-modified",
  D: "text-git-deleted",
  R: "text-git-renamed",
  C: "text-git-info",
  U: "text-git-warning",
};
