import type { MentionItem, ResolvedMentionContext } from "./types";
import * as mentionService from "@/services/frontend/mention.services";
import * as gitService from "@/services/frontend/git.services";
import * as githubService from "@/services/frontend/github.services";

interface ResolveParams {
  mode: "local" | "github";
  repoPath?: string | null;
  owner?: string | null;
  repo?: string | null;
}

const COMMIT_CONTEXT_MAX_CHARS = 4000;

async function resolveFile(mention: MentionItem, params: ResolveParams): Promise<string> {
  if (params.mode === "local" && params.repoPath) {
    const result = await mentionService.getFileContent(params.repoPath, mention.value);
    return `File: ${mention.value}\n\n\`\`\`\n${result.content}\n\`\`\`${result.truncated ? "\n\n(truncated)" : ""}`;
  }
  if (params.mode === "github" && params.owner && params.repo) {
    const result = await mentionService.getGitHubFileContent(params.owner, params.repo, mention.value);
    return `File: ${mention.value}\n\n\`\`\`\n${result.content}\n\`\`\`${result.truncated ? "\n\n(truncated)" : ""}`;
  }
  return `File: ${mention.value}`;
}

async function resolveCommit(mention: MentionItem, params: ResolveParams): Promise<string> {
  try {
    if (params.mode === "local" && params.repoPath) {
      const detail = await gitService.getCommitDetail(params.repoPath, mention.value);
      const diff = detail.diff?.slice(0, COMMIT_CONTEXT_MAX_CHARS) || "";
      return `Commit: ${detail.abbreviatedHash} - ${detail.message}\nAuthor: ${detail.authorName}\nDate: ${detail.date}\n\n${diff}${detail.diff && detail.diff.length > COMMIT_CONTEXT_MAX_CHARS ? "\n\n(diff truncated)" : ""}`;
    }
    if (params.mode === "github" && params.owner && params.repo) {
      const detail = await githubService.getGitHubCommitDetail(params.owner, params.repo, mention.value);
      const diff = detail.diff?.slice(0, COMMIT_CONTEXT_MAX_CHARS) || "";
      return `Commit: ${detail.abbreviatedHash} - ${detail.message}\nAuthor: ${detail.authorName}\nDate: ${detail.date}\n\n${diff}${detail.diff && detail.diff.length > COMMIT_CONTEXT_MAX_CHARS ? "\n\n(diff truncated)" : ""}`;
    }
  } catch {
    // Fall through to lightweight
  }
  return `Commit: ${mention.value} - ${mention.label}`;
}

function resolveBranch(mention: MentionItem): string {
  return `Branch: ${mention.value}`;
}

function resolveTag(mention: MentionItem): string {
  return `Tag: ${mention.value}`;
}

function resolveStash(mention: MentionItem): string {
  return `Stash: ${mention.label}`;
}

function resolveRepository(mention: MentionItem): string {
  return `Repository: ${mention.value}`;
}

export async function resolveMentionContext(
  mention: MentionItem,
  params: ResolveParams
): Promise<ResolvedMentionContext> {
  let content: string;

  switch (mention.category) {
    case "file":
      content = await resolveFile(mention, params);
      break;
    case "commit":
      content = await resolveCommit(mention, params);
      break;
    case "branch":
      content = resolveBranch(mention);
      break;
    case "tag":
      content = resolveTag(mention);
      break;
    case "stash":
      content = resolveStash(mention);
      break;
    case "repository":
      content = resolveRepository(mention);
      break;
  }

  return {
    category: mention.category,
    label: mention.label,
    value: mention.value,
    content,
  };
}

export async function resolveAllMentions(
  mentions: MentionItem[],
  params: ResolveParams
): Promise<ResolvedMentionContext[]> {
  const results = await Promise.allSettled(
    mentions.map((m) => resolveMentionContext(m, params))
  );

  return results
    .filter((r): r is PromiseFulfilledResult<ResolvedMentionContext> => r.status === "fulfilled")
    .map((r) => r.value);
}

export function buildMentionContextBlock(resolved: ResolvedMentionContext[]): string {
  if (resolved.length === 0) return "";

  const sections = resolved.map((r) => r.content).join("\n\n---\n\n");

  return `\n\n---\n\n## User-Referenced Context\n\n${sections}`;
}
