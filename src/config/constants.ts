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

export const FILE_STATUS_LABELS: Record<string, string> = {
  A: "Added",
  M: "Modified",
  D: "Deleted",
  R: "Renamed",
  C: "Copied",
  U: "Unmerged",
};

// ─── Mentions ──────────────────────────────────────────────────────────────

import type { MentionCategory } from "@/lib/mentions/types";

export const MENTION_FILE_CONTENT_MAX_CHARS = 6000;
export const MENTION_MAX_ITEMS_PER_CATEGORY = 50;

export const MENTION_CATEGORY_SHORTCUTS: Record<string, MentionCategory> = {
  file: "file",
  commit: "commit",
  branch: "branch",
  tag: "tag",
  repo: "repository",
};

export const MENTION_CATEGORIES = [
  {
    id: "file" as const,
    label: "File",
    icon: "FileText",
    placeholder: "Search files...",
  },
  {
    id: "commit" as const,
    label: "Commit",
    icon: "GitCommitHorizontal",
    placeholder: "Search commits...",
  },
  {
    id: "branch" as const,
    label: "Branch",
    icon: "GitBranch",
    placeholder: "Search branches...",
  },
  {
    id: "tag" as const,
    label: "Tag",
    icon: "Tag",
    placeholder: "Search tags...",
  },
  {
    id: "repository" as const,
    label: "Repository",
    icon: "FolderGit2",
    placeholder: "Search repos...",
  },
] as const;

// ─── AI Models ────────────────────────────────────────────────────────────

const modelLogo = (provider: string) =>
  `https://models.dev/logos/${provider}.svg`;

export const AI_MODELS = [
  {
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    provider: "google",
    logo: "/ai/gemini.svg",
  },
  {
    id: "gpt-4o",
    name: "GPT-4o",
    provider: "openai",
    logo: modelLogo("openai"),
  },
  {
    id: "claude-sonnet-4-6",
    name: "Claude Sonnet 4.6",
    provider: "anthropic",
    logo: modelLogo("anthropic"),
  },
  {
    id: "lmstudio-local",
    name: "LM Studio (Local)",
    provider: "lmstudio",
    logo: "/ai/lm-studio.svg",
  },
] as const;

export type AIModel = (typeof AI_MODELS)[number];

// ─── Storage Keys ────────────────────────────────────────────────────────

export const STORAGE_KEYS = {
  selectedModel: "gitpilot:selected-model",
} as const;

// ─── Service Status ───────────────────────────────────────────────────────────
// Set `enabled: false` to block all chat requests and surface the message as a toast.

export const SERVICE_STATUS = {
  enabled: false,
  title: "GitPilot is currently paused",
  message:
    "We're an unfunded side project and have run out of AI credits. " +
    "Self-host with your own API keys to keep using it — the code is open source.",
} as const;

export const FILE_STATUS_COLORS: Record<string, string> = {
  A: "text-git-added",
  M: "text-git-modified",
  D: "text-git-deleted",
  R: "text-git-renamed",
  C: "text-git-info",
  U: "text-git-warning",
};
