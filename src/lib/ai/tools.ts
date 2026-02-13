import { tool } from "ai";
import { z } from "zod";
import {
  getGitClient,
  getCommits,
  getCommitDetail,
  getBranches,
  getDiff,
  getStatus,
  getTags,
  getStashList,
  createBranch,
  checkoutBranch,
  cherryPickCommit,
  revertCommit,
} from "@/lib/git";

/**
 * Creates a set of git-aware AI tools scoped to a specific repo path.
 * Read-only tools auto-execute; write tools require user approval.
 */
export function createGitTools(repoPath: string) {
  const git = getGitClient(repoPath);

  return {
    // ─── Read-Only Tools (auto-executed) ───────────────────────────

    getRepoOverview: tool({
      description:
        "Get an overview of the repository including current branch, remotes, clean/dirty state, and head commit. Always call this first to understand the repo context.",
      inputSchema: z.object({}),
      execute: async () => {
        const [branchSummary, remotes, log, status] = await Promise.all([
          git.branchLocal(),
          git.getRemotes(true),
          git.log({ maxCount: 1 }),
          git.status(),
        ]);
        return {
          path: repoPath,
          currentBranch: branchSummary.current,
          remotes: remotes.map((r) => ({
            name: r.name,
            fetchUrl: r.refs.fetch,
          })),
          isClean: status.isClean(),
          headCommit: log.latest?.hash?.slice(0, 7) ?? "",
          headMessage: log.latest?.message ?? "",
          staged: status.staged.length,
          modified: status.modified.length,
          untracked: status.not_added.length,
        };
      },
    }),

    getCommitHistory: tool({
      description:
        "Search and list commits. Supports filtering by branch, search text in commit messages, and author name. Returns commit hash, message, author, date. Use maxCount to limit results (default 20).",
      inputSchema: z.object({
        branch: z.string().optional().describe("Branch name to get commits from. Defaults to current branch."),
        search: z.string().optional().describe("Search text to filter commit messages (case-insensitive grep)."),
        author: z.string().optional().describe("Filter commits by author name."),
        maxCount: z.number().optional().default(20).describe("Maximum number of commits to return (default 20, max 50)."),
        skip: z.number().optional().default(0).describe("Number of commits to skip for pagination."),
      }),
      execute: async ({ branch, search, author, maxCount, skip }) => {
        const result = await getCommits(git, {
          branch,
          search,
          author,
          maxCount: Math.min(maxCount ?? 20, 50),
          skip: skip ?? 0,
        });
        return {
          total: result.total,
          count: result.commits.length,
          commits: result.commits.map((c) => ({
            hash: c.abbreviatedHash,
            fullHash: c.hash,
            message: c.message,
            author: c.authorName,
            date: c.date,
            refs: c.refs || undefined,
          })),
        };
      },
    }),

    getCommitDetails: tool({
      description:
        "Get full details of a specific commit including the diff, file changes with insertions/deletions stats, and commit body. Use this to understand what a specific commit changed.",
      inputSchema: z.object({
        hash: z.string().describe("The commit hash (full or abbreviated) to examine."),
      }),
      execute: async ({ hash }) => {
        const detail = await getCommitDetail(git, hash);
        // Truncate diff if too large to avoid token overflow
        const maxDiffLength = 8000;
        const truncatedDiff =
          detail.diff.length > maxDiffLength
            ? detail.diff.slice(0, maxDiffLength) + "\n\n... [diff truncated, showing first 8000 chars]"
            : detail.diff;

        return {
          hash: detail.abbreviatedHash,
          fullHash: detail.hash,
          message: detail.message,
          body: detail.body || undefined,
          author: `${detail.authorName} <${detail.authorEmail}>`,
          date: detail.date,
          refs: detail.refs || undefined,
          parentHashes: detail.parentHashes,
          stats: detail.stats,
          files: detail.files.map((f) => ({
            file: f.file,
            status: f.status,
            insertions: f.insertions,
            deletions: f.deletions,
          })),
          diff: truncatedDiff,
        };
      },
    }),

    listBranches: tool({
      description:
        "List all local and remote branches with their latest commit, sorted by most recent activity. Shows which branch is currently checked out.",
      inputSchema: z.object({}),
      execute: async () => {
        const branches = await getBranches(git);
        const local = branches.filter((b) => !b.isRemote);
        const remote = branches.filter((b) => b.isRemote);
        return {
          current: local.find((b) => b.current)?.name ?? "unknown",
          local: local.map((b) => ({
            name: b.name,
            current: b.current,
            commit: b.commit,
            label: b.label,
          })),
          remote: remote.slice(0, 30).map((b) => ({
            name: b.name,
            commit: b.commit,
          })),
          totalRemote: remote.length,
        };
      },
    }),

    compareDiff: tool({
      description:
        "Get the diff between two git refs (branches, commits, or tags). Use this to understand what changed between two points in history.",
      inputSchema: z.object({
        from: z.string().describe("The source ref (branch name, commit hash, or tag) to compare from."),
        to: z.string().describe("The target ref (branch name, commit hash, or tag) to compare to."),
      }),
      execute: async ({ from, to }) => {
        const result = await getDiff(git, from, to);
        const maxDiffLength = 8000;
        const truncatedDiff =
          result.diff.length > maxDiffLength
            ? result.diff.slice(0, maxDiffLength) + "\n\n... [diff truncated, showing first 8000 chars]"
            : result.diff;
        return {
          from: result.from,
          to: result.to,
          diffLength: result.diff.length,
          diff: truncatedDiff,
        };
      },
    }),

    getWorkingTreeStatus: tool({
      description:
        "Get the current working tree status: staged files, modified files, untracked files, deleted files, conflicts, ahead/behind tracking branch. Use this to understand what changes are pending.",
      inputSchema: z.object({}),
      execute: async () => {
        const status = await getStatus(git);
        return {
          currentBranch: status.current,
          tracking: status.tracking,
          ahead: status.ahead,
          behind: status.behind,
          isClean: status.isClean,
          staged: status.staged,
          modified: status.modified,
          deleted: status.deleted,
          untracked: status.untracked,
          conflicted: status.conflicted,
        };
      },
    }),

    listTags: tool({
      description:
        "List all tags in the repository with their hash, message, date, and whether they are annotated. Sorted by most recent first.",
      inputSchema: z.object({}),
      execute: async () => {
        const tags = await getTags(git);
        return {
          count: tags.length,
          tags: tags.slice(0, 50).map((t) => ({
            name: t.name,
            hash: t.hash,
            message: t.message || undefined,
            date: t.date,
            isAnnotated: t.isAnnotated,
          })),
        };
      },
    }),

    listStashes: tool({
      description: "List all stashed changes with their index, message, date, and hash.",
      inputSchema: z.object({}),
      execute: async () => {
        const stashes = await getStashList(git);
        return {
          count: stashes.length,
          stashes: stashes.map((s) => ({
            index: s.index,
            message: s.message,
            date: s.date,
            hash: s.hash,
          })),
        };
      },
    }),

    getFileContent: tool({
      description:
        "Read the content of a specific file at a given git ref (commit, branch, or tag). Use this to examine source code at a specific point in history.",
      inputSchema: z.object({
        filePath: z.string().describe("The file path relative to the repo root."),
        ref: z.string().optional().default("HEAD").describe("The git ref to read the file from (default: HEAD). Can be a commit hash, branch name, or tag."),
      }),
      execute: async ({ filePath, ref }) => {
        try {
          const content = await git.show([`${ref}:${filePath}`]);
          const maxLength = 6000;
          const truncated =
            content.length > maxLength
              ? content.slice(0, maxLength) + "\n\n... [file truncated, showing first 6000 chars]"
              : content;
          return {
            filePath,
            ref,
            length: content.length,
            content: truncated,
          };
        } catch {
          return {
            filePath,
            ref,
            error: `File '${filePath}' not found at ref '${ref}'.`,
          };
        }
      },
    }),

    listFiles: tool({
      description:
        "List files in the repository at a given ref. Can list all files or files in a specific directory. Useful for exploring the repo structure.",
      inputSchema: z.object({
        directory: z.string().optional().default("").describe("Subdirectory to list files from (empty for root)."),
        ref: z.string().optional().default("HEAD").describe("Git ref to list files at (default: HEAD)."),
      }),
      execute: async ({ directory, ref }) => {
        try {
          const raw = await git.raw(["ls-tree", "--name-only", ref ?? "HEAD", directory ? `${directory}/` : ""]);
          const files = raw.trim().split("\n").filter(Boolean);
          return {
            ref: ref ?? "HEAD",
            directory: directory || "/",
            count: files.length,
            files: files.slice(0, 100),
          };
        } catch {
          return {
            ref: ref ?? "HEAD",
            directory: directory || "/",
            error: "Failed to list files. Check that the ref and directory are valid.",
          };
        }
      },
    }),

    // ─── Write Tools (require user confirmation via UI) ────────────

    createNewBranch: tool({
      description:
        "Create a new git branch and check it out. This is a WRITE operation that modifies the repository.",
      inputSchema: z.object({
        name: z.string().describe("The name for the new branch."),
        startPoint: z.string().optional().describe("The commit/branch/tag to create the branch from. Defaults to HEAD."),
      }),
      execute: async ({ name, startPoint }) => {
        return await createBranch(git, name, startPoint);
      },
    }),

    switchBranch: tool({
      description:
        "Switch to a different branch. This is a WRITE operation that modifies the working tree.",
      inputSchema: z.object({
        name: z.string().describe("The branch name to switch to."),
      }),
      execute: async ({ name }) => {
        return await checkoutBranch(git, name);
      },
    }),

    cherryPickCommits: tool({
      description:
        "Cherry-pick one or more commits onto the current branch. This is a WRITE operation that creates new commits.",
      inputSchema: z.object({
        hashes: z.array(z.string()).describe("Array of commit hashes to cherry-pick."),
      }),
      execute: async ({ hashes }) => {
        return await cherryPickCommit(git, hashes);
      },
    }),

    revertCommits: tool({
      description:
        "Revert one or more commits by creating new commits that undo their changes. This is a WRITE operation.",
      inputSchema: z.object({
        hashes: z.array(z.string()).describe("Array of commit hashes to revert."),
      }),
      execute: async ({ hashes }) => {
        return await revertCommit(git, hashes);
      },
    }),
  };
}

export type GitTools = ReturnType<typeof createGitTools>;
