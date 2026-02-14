import { tool } from "ai";
import { z } from "zod";
import {
  getUserRepos,
  getRepoInfo,
  getCommits,
  getCommitDetail,
  getBranches,
  getTags,
  getCompare,
  getStatus,
  getFileTree,
  getFileContent,
  createBranch,
  deleteBranch,
  cherryPickCommit,
  revertCommit,
  resetBranch,
  getContributors,
  getUserProfile,
  createRepository,
  createOrUpdateFile,
  deleteFile,
  createRelease,
} from "@/lib/github/client";

/**
 * Creates a set of GitHub-aware AI tools scoped to a specific repo.
 * Includes read operations (safe) and write operations (modify remote repo).
 */
export function createGitHubTools(
  owner: string,
  repo: string,
  token: string,
) {
  return {
    getRepoOverview: tool({
      description:
        "Get an overview of the repository including default branch, remotes, and status. Always call this first to understand the repo context.",
      inputSchema: z.object({}),
      execute: async () => {
        const info = await getRepoInfo(token, owner, repo);
        const status = await getStatus(token, owner, repo);
        return {
          path: `${owner}/${repo}`,
          currentBranch: info.currentBranch,
          remotes: info.remotes.map((r) => ({
            name: r.name,
            fetchUrl: r.refs.fetch,
          })),
          isClean: status.isClean,
          headCommit: info.headCommit,
          staged: status.staged.length,
          modified: status.modified.length,
          untracked: status.untracked.length,
        };
      },
    }),

    getCommitHistory: tool({
      description:
        "Search and list commits. Supports filtering by branch. Returns commit hash, message, author, date. Use maxCount to limit results (default 20).",
      inputSchema: z.object({
        branch: z
          .string()
          .optional()
          .describe("Branch name to get commits from. Defaults to default branch."),
        maxCount: z
          .number()
          .optional()
          .default(20)
          .describe("Maximum number of commits to return (default 20, max 50)."),
      }),
      execute: async ({ branch, maxCount }) => {
        const commits = await getCommits(token, owner, repo, {
          branch,
          maxCount: Math.min(maxCount ?? 20, 50),
        });
        return {
          total: commits.length,
          count: commits.length,
          commits: commits.map((c) => ({
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
        "Get full details of a specific commit including the diff, file changes with insertions/deletions stats. Use this to understand what a specific commit changed.",
      inputSchema: z.object({
        hash: z
          .string()
          .describe("The commit hash (full or abbreviated) to examine."),
      }),
      execute: async ({ hash }) => {
        const detail = await getCommitDetail(token, owner, repo, hash);
        const maxDiffLength = 8000;
        const truncatedDiff =
          detail.diff.length > maxDiffLength
            ? detail.diff.slice(0, maxDiffLength) +
              "\n\n... [diff truncated, showing first 8000 chars]"
            : detail.diff;

        return {
          hash: detail.abbreviatedHash,
          fullHash: detail.hash,
          message: detail.message,
          body: detail.body || undefined,
          author: `${detail.authorName} <${detail.authorEmail}>`,
          date: detail.date,
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
        "List all branches with their latest commit. Shows which branch is the default.",
      inputSchema: z.object({}),
      execute: async () => {
        const branches = await getBranches(token, owner, repo);
        return {
          current:
            branches.find((b) => b.current)?.name ?? "unknown",
          branches: branches.map((b) => ({
            name: b.name,
            current: b.current,
            commit: b.commit,
          })),
        };
      },
    }),

    compareDiff: tool({
      description:
        "Get the diff between two git refs (branches, commits, or tags). Use this to understand what changed between two points in history.",
      inputSchema: z.object({
        from: z
          .string()
          .describe("The source ref (branch name, commit hash, or tag) to compare from."),
        to: z
          .string()
          .describe("The target ref (branch name, commit hash, or tag) to compare to."),
      }),
      execute: async ({ from, to }) => {
        const result = await getCompare(token, owner, repo, from, to);
        const maxDiffLength = 8000;
        const truncatedDiff =
          result.diff.length > maxDiffLength
            ? result.diff.slice(0, maxDiffLength) +
              "\n\n... [diff truncated, showing first 8000 chars]"
            : result.diff;
        return {
          from: result.from,
          to: result.to,
          diffLength: result.diff.length,
          diff: truncatedDiff,
        };
      },
    }),

    listTags: tool({
      description:
        "List all tags in the repository with their hash.",
      inputSchema: z.object({}),
      execute: async () => {
        const tags = await getTags(token, owner, repo);
        return {
          count: tags.length,
          tags: tags.slice(0, 50).map((t) => ({
            name: t.name,
            hash: t.hash,
          })),
        };
      },
    }),

    listFiles: tool({
      description:
        "List files in the repository at a given ref. Can list all files or files in a specific directory. Useful for exploring the repo structure.",
      inputSchema: z.object({
        directory: z
          .string()
          .optional()
          .default("")
          .describe("Subdirectory to list files from (empty for root)."),
        ref: z
          .string()
          .optional()
          .describe("Git ref to list files at (default: default branch)."),
      }),
      execute: async ({ directory, ref }) => {
        try {
          const files = await getFileTree(
            token,
            owner,
            repo,
            directory || "",
            ref,
          );
          return {
            ref: ref || "HEAD",
            directory: directory || "/",
            count: files.length,
            files: files.slice(0, 100).map((f) => ({
              name: f.name,
              path: f.path,
              type: f.type,
            })),
          };
        } catch {
          return {
            ref: ref || "HEAD",
            directory: directory || "/",
            error:
              "Failed to list files. Check that the ref and directory are valid.",
          };
        }
      },
    }),

    getFileContent: tool({
      description:
        "Read the content of a file in the repository at a given ref. Returns the file content as text. Useful for examining source code, configs, docs, etc.",
      inputSchema: z.object({
        filePath: z
          .string()
          .describe("Path to the file relative to the repo root (e.g. 'src/index.ts')."),
        ref: z
          .string()
          .optional()
          .describe("Git ref to read the file at (branch, tag, or commit hash). Defaults to default branch."),
      }),
      execute: async ({ filePath, ref }) => {
        try {
          const result = await getFileContent(token, owner, repo, filePath, ref);
          const maxLength = 6000;
          const truncated =
            result.content.length > maxLength
              ? result.content.slice(0, maxLength) +
                "\n\n... [content truncated, showing first 6000 chars]"
              : result.content;
          return {
            path: result.path,
            ref: result.ref,
            size: result.size,
            content: truncated,
          };
        } catch (error) {
          return {
            error: `Failed to read file: ${error instanceof Error ? error.message : "Unknown error"}`,
          };
        }
      },
    }),

    createBranch: tool({
      description:
        "Create a new branch in the repository. Can branch from any existing branch, tag, or commit SHA. Defaults to branching from the default branch.",
      inputSchema: z.object({
        name: z
          .string()
          .describe("Name for the new branch."),
        fromRef: z
          .string()
          .optional()
          .describe("Branch, tag, or commit SHA to create the branch from. Defaults to default branch."),
      }),
      execute: async ({ name, fromRef }) => {
        try {
          return await createBranch(token, owner, repo, name, fromRef);
        } catch (error) {
          return {
            success: false,
            message: `Failed to create branch: ${error instanceof Error ? error.message : "Unknown error"}`,
          };
        }
      },
    }),

    deleteBranch: tool({
      description:
        "Delete a branch from the repository. Cannot delete the default branch. This is irreversible.",
      inputSchema: z.object({
        branch: z
          .string()
          .describe("Name of the branch to delete."),
      }),
      needsApproval: true,
      execute: async ({ branch }) => {
        try {
          return await deleteBranch(token, owner, repo, branch);
        } catch (error) {
          return {
            success: false,
            message: `Failed to delete branch: ${error instanceof Error ? error.message : "Unknown error"}`,
          };
        }
      },
    }),

    cherryPickCommits: tool({
      description:
        "Cherry-pick a single commit onto a target branch. Creates a new commit on the target branch with the same changes as the source commit.",
      inputSchema: z.object({
        branch: z
          .string()
          .describe("Target branch to cherry-pick onto."),
        hash: z
          .string()
          .describe("The commit hash to cherry-pick."),
      }),
      needsApproval: true,
      execute: async ({ branch, hash }) => {
        try {
          return await cherryPickCommit(token, owner, repo, branch, hash);
        } catch (error) {
          return {
            success: false,
            message: `Failed to cherry-pick: ${error instanceof Error ? error.message : "Unknown error"}`,
          };
        }
      },
    }),

    revertCommits: tool({
      description:
        "Revert a single commit on a target branch. Creates a new commit that undoes the changes from the specified commit.",
      inputSchema: z.object({
        branch: z
          .string()
          .describe("Target branch to revert on."),
        hash: z
          .string()
          .describe("The commit hash to revert."),
      }),
      needsApproval: true,
      execute: async ({ branch, hash }) => {
        try {
          return await revertCommit(token, owner, repo, branch, hash);
        } catch (error) {
          return {
            success: false,
            message: `Failed to revert: ${error instanceof Error ? error.message : "Unknown error"}`,
          };
        }
      },
    }),

    resetBranch: tool({
      description:
        "Force-reset a branch to point at a specific commit SHA. WARNING: This is destructive — any commits after the target SHA will be lost. Use with extreme caution.",
      inputSchema: z.object({
        branch: z
          .string()
          .describe("Branch to reset."),
        sha: z
          .string()
          .describe("The commit SHA to reset the branch to."),
      }),
      needsApproval: true,
      execute: async ({ branch, sha }) => {
        try {
          return await resetBranch(token, owner, repo, branch, sha);
        } catch (error) {
          return {
            success: false,
            message: `Failed to reset branch: ${error instanceof Error ? error.message : "Unknown error"}`,
          };
        }
      },
    }),

    listContributors: tool({
      description:
        "List contributors to this repository with their avatar, commit count, and account type. Use this when the user asks who contributes to the repo.",
      inputSchema: z.object({
        maxCount: z
          .number()
          .optional()
          .default(30)
          .describe("Maximum number of contributors to return (default 30, max 100)."),
      }),
      execute: async ({ maxCount }) => {
        const contributors = await getContributors(token, owner, repo, {
          maxCount: Math.min(maxCount ?? 30, 100),
        });
        return {
          count: contributors.length,
          contributors,
        };
      },
    }),

    getUserProfile: tool({
      description:
        "Get the public GitHub profile for a user by username. Returns bio, stats, company, location, and links. Use this when the user asks about a specific GitHub user.",
      inputSchema: z.object({
        username: z
          .string()
          .describe("The GitHub username to look up."),
      }),
      execute: async ({ username }) => {
        try {
          return await getUserProfile(token, username);
        } catch (error) {
          return {
            error: `Failed to fetch profile for "${username}": ${error instanceof Error ? error.message : "Unknown error"}`,
          };
        }
      },
    }),

    createOrUpdateFile: tool({
      description:
        "Create or update a file in the repository. Commits directly to a branch. For updating an existing file, the sha parameter is required — get it from getFileContent first.",
      inputSchema: z.object({
        path: z
          .string()
          .describe("File path relative to repo root (e.g. 'src/index.ts')."),
        content: z
          .string()
          .describe("File content (plain text)."),
        message: z
          .string()
          .describe("Commit message for this change."),
        branch: z
          .string()
          .optional()
          .describe("Branch to commit to. Defaults to the default branch."),
        sha: z
          .string()
          .optional()
          .describe("Required for updating existing files. Get from getFileContent."),
      }),
      needsApproval: true,
      execute: async ({ path, content, message, branch, sha }) => {
        try {
          return await createOrUpdateFile(token, owner, repo, path, content, message, { branch, sha });
        } catch (error) {
          return {
            success: false,
            message: `Failed to create/update file: ${error instanceof Error ? error.message : "Unknown error"}`,
          };
        }
      },
    }),

    deleteFile: tool({
      description:
        "Delete a file from the repository. This is irreversible. The sha parameter is required — get it from getFileContent first.",
      inputSchema: z.object({
        path: z
          .string()
          .describe("File path to delete (relative to repo root)."),
        message: z
          .string()
          .describe("Commit message for the deletion."),
        sha: z
          .string()
          .describe("File SHA (required). Get from getFileContent."),
        branch: z
          .string()
          .optional()
          .describe("Branch to commit to. Defaults to the default branch."),
      }),
      needsApproval: true,
      execute: async ({ path, message, sha, branch }) => {
        try {
          return await deleteFile(token, owner, repo, path, message, sha, { branch });
        } catch (error) {
          return {
            success: false,
            message: `Failed to delete file: ${error instanceof Error ? error.message : "Unknown error"}`,
          };
        }
      },
    }),

    createRelease: tool({
      description:
        "Create a GitHub release with a tag and optional release notes. Use this when the user wants to publish a new version or release.",
      inputSchema: z.object({
        tagName: z
          .string()
          .describe("Tag name, e.g. 'v1.0.0'."),
        name: z
          .string()
          .optional()
          .describe("Release title."),
        body: z
          .string()
          .optional()
          .describe("Release notes (markdown)."),
        draft: z
          .boolean()
          .optional()
          .default(false)
          .describe("Create as draft release."),
        prerelease: z
          .boolean()
          .optional()
          .default(false)
          .describe("Mark as pre-release."),
        targetBranch: z
          .string()
          .optional()
          .describe("Branch to tag. Defaults to the default branch."),
      }),
      needsApproval: true,
      execute: async ({ tagName, name, body, draft, prerelease, targetBranch }) => {
        try {
          return await createRelease(token, owner, repo, tagName, { name, body, draft, prerelease, targetBranch });
        } catch (error) {
          return {
            success: false,
            message: `Failed to create release: ${error instanceof Error ? error.message : "Unknown error"}`,
          };
        }
      },
    }),
  };
}

/**
 * Creates general GitHub tools that don't require a specific repo.
 * Used when the user hasn't selected a repository yet.
 */
export function createGeneralTools(token: string) {
  return {
    listUserRepos: tool({
      description:
        "List the authenticated user's GitHub repositories. Returns repos sorted by most recently updated. Use this when the user asks to see their repos, find a project, or hasn't selected a repository yet.",
      inputSchema: z.object({
        query: z
          .string()
          .optional()
          .describe("Optional search term to filter repos by name."),
      }),
      execute: async ({ query }) => {
        const repos = await getUserRepos(token);
        const filtered = query
          ? repos.filter((r) =>
              r.fullName.toLowerCase().includes(query.toLowerCase()) ||
              (r.description?.toLowerCase().includes(query.toLowerCase()) ?? false)
            )
          : repos;
        return {
          total: filtered.length,
          repos: filtered.slice(0, 50).map((r) => ({
            fullName: r.fullName,
            owner: r.owner,
            name: r.name,
            description: r.description,
            language: r.language,
            isPrivate: r.isPrivate,
            defaultBranch: r.defaultBranch,
            stars: r.stargazersCount,
            updatedAt: r.updatedAt,
            url: r.url,
          })),
        };
      },
    }),

    selectRepository: tool({
      description:
        "Select a repository to work with. Call this when the user wants to explore a specific repo (e.g. 'select web-sense', 'use that repo', 'open nabinkhair42/pest-js'). After calling this, the next message will have full repo tools (branches, commits, files, etc.).",
      inputSchema: z.object({
        owner: z.string().describe("Repository owner (e.g. 'nabinkhair42')."),
        repo: z.string().describe("Repository name (e.g. 'web-sense')."),
      }),
      execute: async ({ owner, repo }) => {
        try {
          const info = await getRepoInfo(token, owner, repo);
          return {
            success: true,
            message: `Repository ${owner}/${repo} selected. You now have full access to explore its branches, commits, files, and more.`,
            defaultBranch: info.currentBranch,
            headCommit: info.headCommit,
          };
        } catch {
          return {
            success: false,
            message: `Repository ${owner}/${repo} not found or not accessible.`,
          };
        }
      },
    }),

    getUserProfile: tool({
      description:
        "Get the public GitHub profile for a user by username. Returns bio, stats, company, location, and links. Use this when the user asks about a specific GitHub user.",
      inputSchema: z.object({
        username: z
          .string()
          .describe("The GitHub username to look up."),
      }),
      execute: async ({ username }) => {
        try {
          return await getUserProfile(token, username);
        } catch (error) {
          return {
            error: `Failed to fetch profile for "${username}": ${error instanceof Error ? error.message : "Unknown error"}`,
          };
        }
      },
    }),

    createRepository: tool({
      description:
        "Create a new GitHub repository for the authenticated user. Can set visibility, initialize with README, add .gitignore, and choose a license.",
      inputSchema: z.object({
        name: z
          .string()
          .describe("Repository name."),
        description: z
          .string()
          .optional()
          .describe("Repository description."),
        isPrivate: z
          .boolean()
          .optional()
          .default(false)
          .describe("Whether the repository should be private."),
        autoInit: z
          .boolean()
          .optional()
          .default(true)
          .describe("Initialize with a README."),
        gitignoreTemplate: z
          .string()
          .optional()
          .describe("Gitignore template name, e.g. 'Node', 'Python'."),
        license: z
          .string()
          .optional()
          .describe("License template, e.g. 'mit', 'apache-2.0'."),
      }),
      needsApproval: true,
      execute: async ({ name, description, isPrivate, autoInit, gitignoreTemplate, license }) => {
        try {
          return await createRepository(token, name, { description, isPrivate, autoInit, gitignoreTemplate, license });
        } catch (error) {
          return {
            success: false,
            message: `Failed to create repository: ${error instanceof Error ? error.message : "Unknown error"}`,
          };
        }
      },
    }),
  };
}
