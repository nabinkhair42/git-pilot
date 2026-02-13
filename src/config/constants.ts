export const APP_NAME = "Git Commit Manager";
export const DEFAULT_COMMITS_PER_PAGE = 50;
export const MAX_RECENT_REPOS = 10;
export const STATUS_REFRESH_INTERVAL = 5000;

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

export const FILE_STATUS_COLORS: Record<string, string> = {
  A: "text-git-added",
  M: "text-git-modified",
  D: "text-git-deleted",
  R: "text-git-renamed",
  C: "text-git-info",
  U: "text-git-warning",
};
