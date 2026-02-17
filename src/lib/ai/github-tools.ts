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
  mergeBranch,
  cherryPickCommit,
  revertCommit,
  resetBranch,
  getContributors,
  getUserProfile,
  createRepository,
  deleteRepository,
  createOrUpdateFile,
  deleteFile,
  createRelease,
  listPullRequests,
  getPullRequestDetail,
  createPullRequest,
  mergePullRequest,
} from "@/lib/github/client";

/**
 * Creates ALL AI tools in a single set with a mutable repo context.
 * General tools (listUserRepos, selectRepository, createRepository, etc.) are always functional.
 * Repo-scoped tools read from `ctx` and return an error if no repo is selected.
 * `selectRepository` and `createRepository` update `ctx` mid-chain so repo tools
 * become functional within the same multi-step stream.
 */
export function createAllTools(
  token: string,
  initialOwner?: string,
  initialRepo?: string,
) {
  // Mutable context — updated by selectRepository and createRepository
  const ctx = {
    owner: initialOwner ?? "",
    repo: initialRepo ?? "",
  };

  /** Guard: returns an error object if no repo is selected, otherwise null. */
  function requireRepo(toolName: string) {
    if (!ctx.owner || !ctx.repo) {
      return {
        error: `No repository selected. Use "selectRepository" or "createRepository" first before calling "${toolName}".`,
      };
    }
    return null;
  }

  return {
    // ──────────────────────────────────────────────
    // General tools (always functional)
    // ──────────────────────────────────────────────

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
        "Select a repository to work with. Call this when the user wants to explore a specific repo (e.g. 'select web-sense', 'use that repo', 'open nabinkhair42/pest-js'). After calling this, all repo-scoped tools become available in the same conversation turn.",
      inputSchema: z.object({
        owner: z.string().describe("Repository owner (e.g. 'nabinkhair42')."),
        repo: z.string().describe("Repository name (e.g. 'web-sense')."),
      }),
      execute: async ({ owner, repo }) => {
        try {
          const info = await getRepoInfo(token, owner, repo);
          // Update mutable context so repo-scoped tools work immediately
          ctx.owner = owner;
          ctx.repo = repo;
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

    createRepository: tool({
      description:
        "Create a new GitHub repository for the authenticated user. Can set visibility, initialize with README, add .gitignore, and choose a license. After creation, the new repo is automatically selected for subsequent tool calls.",
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
          const result = await createRepository(token, name, { description, isPrivate, autoInit, gitignoreTemplate, license });
          // Update mutable context so repo-scoped tools work immediately
          if (result.success && result.owner && result.name) {
            ctx.owner = result.owner;
            ctx.repo = result.name;
          }
          return result;
        } catch (error) {
          return {
            success: false,
            message: `Failed to create repository: ${error instanceof Error ? error.message : "Unknown error"}`,
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

    deleteRepository: tool({
      description:
        "Permanently delete a GitHub repository. This is irreversible — all code, issues, PRs, and settings will be lost.",
      inputSchema: z.object({
        owner: z.string().describe("Repository owner."),
        repo: z.string().describe("Repository name to delete."),
      }),
      needsApproval: true,
      execute: async ({ owner: targetOwner, repo: targetRepo }) => {
        try {
          return await deleteRepository(token, targetOwner, targetRepo);
        } catch (error) {
          return {
            success: false,
            message: `Failed to delete repository: ${error instanceof Error ? error.message : "Unknown error"}`,
          };
        }
      },
    }),

    // ──────────────────────────────────────────────
    // Repo-scoped tools (require ctx.owner/ctx.repo)
    // ──────────────────────────────────────────────

    getRepoOverview: tool({
      description:
        "Get an overview of the repository including default branch, remotes, and status. Always call this first to understand the repo context.",
      inputSchema: z.object({}),
      execute: async () => {
        const guard = requireRepo("getRepoOverview");
        if (guard) return guard;

        const info = await getRepoInfo(token, ctx.owner, ctx.repo);
        const status = await getStatus(token, ctx.owner, ctx.repo);
        return {
          path: `${ctx.owner}/${ctx.repo}`,
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
        const guard = requireRepo("getCommitHistory");
        if (guard) return guard;

        const commits = await getCommits(token, ctx.owner, ctx.repo, {
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
        const guard = requireRepo("getCommitDetails");
        if (guard) return guard;

        const detail = await getCommitDetail(token, ctx.owner, ctx.repo, hash);
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
        const guard = requireRepo("listBranches");
        if (guard) return guard;

        const branches = await getBranches(token, ctx.owner, ctx.repo);
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
        const guard = requireRepo("compareDiff");
        if (guard) return guard;

        const result = await getCompare(token, ctx.owner, ctx.repo, from, to);
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
        const guard = requireRepo("listTags");
        if (guard) return guard;

        const tags = await getTags(token, ctx.owner, ctx.repo);
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
        const guard = requireRepo("listFiles");
        if (guard) return guard;

        try {
          const files = await getFileTree(
            token,
            ctx.owner,
            ctx.repo,
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
        const guard = requireRepo("getFileContent");
        if (guard) return guard;

        try {
          const result = await getFileContent(token, ctx.owner, ctx.repo, filePath, ref);
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
        const guard = requireRepo("createBranch");
        if (guard) return guard;

        try {
          return await createBranch(token, ctx.owner, ctx.repo, name, fromRef);
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
        const guard = requireRepo("deleteBranch");
        if (guard) return guard;

        try {
          return await deleteBranch(token, ctx.owner, ctx.repo, branch);
        } catch (error) {
          return {
            success: false,
            message: `Failed to delete branch: ${error instanceof Error ? error.message : "Unknown error"}`,
          };
        }
      },
    }),

    mergeBranch: tool({
      description:
        "Merge one branch into another. Creates a merge commit on the target (base) branch with changes from the source (head) branch.",
      inputSchema: z.object({
        base: z.string().describe("Target branch to merge into (e.g. 'main')."),
        head: z.string().describe("Source branch to merge from (e.g. 'feature/auth')."),
        commitMessage: z.string().optional().describe("Custom merge commit message. Defaults to GitHub's standard message."),
      }),
      needsApproval: true,
      execute: async ({ base, head, commitMessage }) => {
        const guard = requireRepo("mergeBranch");
        if (guard) return guard;

        try {
          return await mergeBranch(token, ctx.owner, ctx.repo, base, head, { commitMessage });
        } catch (error) {
          return {
            success: false,
            message: `Failed to merge: ${error instanceof Error ? error.message : "Unknown error"}`,
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
        const guard = requireRepo("cherryPickCommits");
        if (guard) return guard;

        try {
          return await cherryPickCommit(token, ctx.owner, ctx.repo, branch, hash);
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
        const guard = requireRepo("revertCommits");
        if (guard) return guard;

        try {
          return await revertCommit(token, ctx.owner, ctx.repo, branch, hash);
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
        const guard = requireRepo("resetBranch");
        if (guard) return guard;

        try {
          return await resetBranch(token, ctx.owner, ctx.repo, branch, sha);
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
        const guard = requireRepo("listContributors");
        if (guard) return guard;

        const contributors = await getContributors(token, ctx.owner, ctx.repo, {
          maxCount: Math.min(maxCount ?? 30, 100),
        });
        return {
          count: contributors.length,
          contributors,
        };
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
        const guard = requireRepo("createOrUpdateFile");
        if (guard) return guard;

        try {
          return await createOrUpdateFile(token, ctx.owner, ctx.repo, path, content, message, { branch, sha });
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
        const guard = requireRepo("deleteFile");
        if (guard) return guard;

        try {
          return await deleteFile(token, ctx.owner, ctx.repo, path, message, sha, { branch });
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
        const guard = requireRepo("createRelease");
        if (guard) return guard;

        try {
          return await createRelease(token, ctx.owner, ctx.repo, tagName, { name, body, draft, prerelease, targetBranch });
        } catch (error) {
          return {
            success: false,
            message: `Failed to create release: ${error instanceof Error ? error.message : "Unknown error"}`,
          };
        }
      },
    }),

    listPullRequests: tool({
      description:
        "List pull requests in the repository. Filter by state (open, closed, all). Returns PR number, title, state, author, branches, and labels.",
      inputSchema: z.object({
        state: z
          .enum(["open", "closed", "all"])
          .optional()
          .default("open")
          .describe("Filter by PR state (default: open)."),
        maxCount: z
          .number()
          .optional()
          .default(30)
          .describe("Maximum number of PRs to return (default 30, max 100)."),
      }),
      execute: async ({ state, maxCount }) => {
        const guard = requireRepo("listPullRequests");
        if (guard) return guard;

        const prs = await listPullRequests(token, ctx.owner, ctx.repo, {
          state: state ?? "open",
          maxCount: Math.min(maxCount ?? 30, 100),
        });
        return { count: prs.length, pullRequests: prs };
      },
    }),

    getPullRequestDetail: tool({
      description:
        "Get full details of a specific pull request including description, reviews, changed files, merge status, and diff stats. Use this to examine a PR in depth.",
      inputSchema: z.object({
        pullNumber: z
          .number()
          .describe("The pull request number to examine."),
      }),
      execute: async ({ pullNumber }) => {
        const guard = requireRepo("getPullRequestDetail");
        if (guard) return guard;

        try {
          const detail = await getPullRequestDetail(token, ctx.owner, ctx.repo, pullNumber);
          return {
            ...detail,
            body: detail.body.length > 4000
              ? detail.body.slice(0, 4000) + "\n\n... [body truncated, showing first 4000 chars]"
              : detail.body,
          };
        } catch (error) {
          return {
            error: `Failed to get PR #${pullNumber}: ${error instanceof Error ? error.message : "Unknown error"}`,
          };
        }
      },
    }),

    createPullRequest: tool({
      description:
        "Create a new pull request. Specify the head (source) and base (target) branches, a title, and optionally a body and draft flag.",
      inputSchema: z.object({
        title: z.string().describe("Pull request title."),
        head: z.string().describe("Source branch (e.g. 'feature/auth')."),
        base: z.string().describe("Target branch (e.g. 'main')."),
        body: z.string().optional().describe("Pull request description (markdown)."),
        draft: z.boolean().optional().default(false).describe("Create as draft PR."),
      }),
      needsApproval: true,
      execute: async ({ title, head, base, body, draft }) => {
        const guard = requireRepo("createPullRequest");
        if (guard) return guard;

        try {
          return await createPullRequest(token, ctx.owner, ctx.repo, title, head, base, { body, draft });
        } catch (error) {
          return {
            success: false,
            message: `Failed to create pull request: ${error instanceof Error ? error.message : "Unknown error"}`,
          };
        }
      },
    }),

    mergePullRequest: tool({
      description:
        "Merge a pull request. Choose merge method: merge (default), squash, or rebase. Optionally set a custom commit title and message.",
      inputSchema: z.object({
        pullNumber: z.number().describe("The pull request number to merge."),
        mergeMethod: z
          .enum(["merge", "squash", "rebase"])
          .optional()
          .default("merge")
          .describe("Merge strategy (default: merge)."),
        commitTitle: z.string().optional().describe("Custom commit title for the merge."),
        commitMessage: z.string().optional().describe("Custom commit message for the merge."),
      }),
      needsApproval: true,
      execute: async ({ pullNumber, mergeMethod, commitTitle, commitMessage }) => {
        const guard = requireRepo("mergePullRequest");
        if (guard) return guard;

        try {
          return await mergePullRequest(token, ctx.owner, ctx.repo, pullNumber, { mergeMethod, commitTitle, commitMessage });
        } catch (error) {
          return {
            success: false,
            message: `Failed to merge PR #${pullNumber}: ${error instanceof Error ? error.message : "Unknown error"}`,
          };
        }
      },
    }),
  };
}
