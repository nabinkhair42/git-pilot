import { Octokit } from "octokit";

/**
 * Create an authenticated Octokit instance.
 */
export function createGitHubClient(accessToken: string) {
  return new Octokit({ auth: accessToken });
}

// ─── Repository ─────────────────────────────────────────────────────────────

export async function getUserRepos(token: string) {
  const octokit = createGitHubClient(token);
  const { data } = await octokit.rest.repos.listForAuthenticatedUser({
    sort: "updated",
    per_page: 100,
    affiliation: "owner,collaborator,organization_member",
  });

  return data.map((repo) => ({
    owner: repo.owner.login,
    name: repo.name,
    fullName: repo.full_name,
    defaultBranch: repo.default_branch,
    isPrivate: repo.private,
    description: repo.description,
    language: repo.language,
    updatedAt: repo.updated_at,
    stargazersCount: repo.stargazers_count,
    url: repo.html_url,
  }));
}

export async function getRepoInfo(token: string, owner: string, repo: string) {
  const octokit = createGitHubClient(token);
  const { data } = await octokit.rest.repos.get({ owner, repo });

  return {
    path: data.full_name,
    currentBranch: data.default_branch,
    remotes: [
      {
        name: "origin",
        refs: {
          fetch: data.clone_url,
          push: data.clone_url,
        },
      },
    ],
    isClean: true, // Remote repos don't have working tree state
    headCommit: data.default_branch,
  };
}

// ─── Commits ────────────────────────────────────────────────────────────────

export async function getCommits(
  token: string,
  owner: string,
  repo: string,
  options: { branch?: string; maxCount?: number } = {}
) {
  const octokit = createGitHubClient(token);
  const { data } = await octokit.rest.repos.listCommits({
    owner,
    repo,
    sha: options.branch,
    per_page: options.maxCount || 50,
  });

  return data.map((commit) => ({
    hash: commit.sha,
    abbreviatedHash: commit.sha.substring(0, 7),
    message: commit.commit.message.split("\n")[0],
    body: commit.commit.message.split("\n").slice(1).join("\n").trim(),
    authorName: commit.commit.author?.name || "Unknown",
    authorEmail: commit.commit.author?.email || "",
    date: commit.commit.author?.date || "",
    refs: "",
    parentHashes: commit.parents.map((p) => p.sha),
  }));
}

export async function getCommitDetail(
  token: string,
  owner: string,
  repo: string,
  hash: string
) {
  const octokit = createGitHubClient(token);

  // async-parallel: both requests use the same hash and are independent
  const [{ data: commit }, diffResponse] = await Promise.all([
    octokit.rest.repos.getCommit({ owner, repo, ref: hash }),
    octokit.request("GET /repos/{owner}/{repo}/commits/{ref}", {
      owner,
      repo,
      ref: hash,
      headers: { accept: "application/vnd.github.diff" },
    }),
  ]);

  const stats = commit.stats || { total: 0, additions: 0, deletions: 0 };

  return {
    hash: commit.sha,
    abbreviatedHash: commit.sha.substring(0, 7),
    message: commit.commit.message.split("\n")[0],
    body: commit.commit.message.split("\n").slice(1).join("\n").trim(),
    authorName: commit.commit.author?.name || "Unknown",
    authorEmail: commit.commit.author?.email || "",
    date: commit.commit.author?.date || "",
    refs: "",
    parentHashes: commit.parents.map((p) => p.sha),
    diff: typeof diffResponse.data === "string" ? diffResponse.data : "",
    stats: {
      changed: stats.total || 0,
      insertions: stats.additions || 0,
      deletions: stats.deletions || 0,
    },
    files: (commit.files || []).map((f) => ({
      file: f.filename,
      changes: f.changes,
      insertions: f.additions,
      deletions: f.deletions,
      binary: f.sha === null,
      status: mapGitHubFileStatus(f.status || "modified"),
    })),
  };
}

// ─── Branches ───────────────────────────────────────────────────────────────

export async function getBranches(
  token: string,
  owner: string,
  repo: string
) {
  const octokit = createGitHubClient(token);

  // async-parallel: branch list and repo info are independent
  const [{ data }, { data: repoData }] = await Promise.all([
    octokit.rest.repos.listBranches({ owner, repo, per_page: 100 }),
    octokit.rest.repos.get({ owner, repo }),
  ]);
  const defaultBranch = repoData.default_branch;

  return data.map((branch) => ({
    name: branch.name,
    current: branch.name === defaultBranch,
    commit: branch.commit.sha.substring(0, 7),
    label: branch.name,
    linkedWorkTree: false,
    isRemote: false,
  }));
}

export async function deleteBranch(
  token: string,
  owner: string,
  repo: string,
  branch: string
) {
  const octokit = createGitHubClient(token);
  await octokit.rest.git.deleteRef({
    owner,
    repo,
    ref: `heads/${branch}`,
  });
  return { success: true, message: `Branch "${branch}" deleted` };
}

export async function createBranch(
  token: string,
  owner: string,
  repo: string,
  branchName: string,
  fromRef?: string
) {
  const octokit = createGitHubClient(token);
  let sha: string;
  if (fromRef) {
    // Try branch, then tag, then treat as commit SHA
    try {
      const { data } = await octokit.rest.git.getRef({ owner, repo, ref: `heads/${fromRef}` });
      sha = data.object.sha;
    } catch {
      try {
        const { data } = await octokit.rest.git.getRef({ owner, repo, ref: `tags/${fromRef}` });
        sha = data.object.sha;
      } catch {
        sha = fromRef;
      }
    }
  } else {
    const { data: repoData } = await octokit.rest.repos.get({ owner, repo });
    const { data } = await octokit.rest.git.getRef({ owner, repo, ref: `heads/${repoData.default_branch}` });
    sha = data.object.sha;
  }
  await octokit.rest.git.createRef({ owner, repo, ref: `refs/heads/${branchName}`, sha });
  return { success: true, message: `Branch "${branchName}" created from ${fromRef || "default branch"} (${sha.substring(0, 7)})` };
}

export async function resetBranch(
  token: string,
  owner: string,
  repo: string,
  branch: string,
  sha: string
) {
  const octokit = createGitHubClient(token);
  await octokit.rest.git.updateRef({
    owner,
    repo,
    ref: `heads/${branch}`,
    sha,
    force: true,
  });
  return { success: true, message: `Branch "${branch}" reset to ${sha.substring(0, 7)}` };
}

export async function cherryPickCommit(
  token: string,
  owner: string,
  repo: string,
  branch: string,
  commitSha: string
) {
  const octokit = createGitHubClient(token);

  // async-parallel: ref lookup and commit detail are independent
  const [ref, commitDetail] = await Promise.all([
    octokit.rest.git.getRef({ owner, repo, ref: `heads/${branch}` }),
    octokit.rest.repos.getCommit({ owner, repo, ref: commitSha }),
  ]);
  const headSha = ref.data.object.sha;
  const headCommit = await octokit.rest.git.getCommit({ owner, repo, commit_sha: headSha });

  const files = commitDetail.data.files || [];
  const message = commitDetail.data.commit.message;

  if (files.length === 0) {
    throw new Error("No file changes found in the commit");
  }

  // Build tree entries from the cherry-picked commit's file changes
  const treeEntries: Array<{
    path: string;
    mode: "100644";
    type: "blob";
    sha: string | null;
  }> = [];

  for (const file of files) {
    if (file.status === "removed") {
      treeEntries.push({ path: file.filename, mode: "100644", type: "blob", sha: null });
    } else if (file.status === "renamed" && file.previous_filename) {
      treeEntries.push({ path: file.previous_filename, mode: "100644", type: "blob", sha: null });
      treeEntries.push({ path: file.filename, mode: "100644", type: "blob", sha: file.sha! });
    } else {
      treeEntries.push({ path: file.filename, mode: "100644", type: "blob", sha: file.sha! });
    }
  }

  // Create new tree based on HEAD's tree with cherry-picked changes
  const newTree = await octokit.rest.git.createTree({
    owner,
    repo,
    base_tree: headCommit.data.tree.sha,
    tree: treeEntries,
  });

  // Create the cherry-pick commit
  const newCommit = await octokit.rest.git.createCommit({
    owner,
    repo,
    message,
    tree: newTree.data.sha,
    parents: [headSha],
  });

  // Update the branch reference
  await octokit.rest.git.updateRef({
    owner,
    repo,
    ref: `heads/${branch}`,
    sha: newCommit.data.sha,
  });

  return { success: true, message: `Cherry-picked ${commitSha.substring(0, 7)} onto "${branch}"` };
}

export async function revertCommit(
  token: string,
  owner: string,
  repo: string,
  branch: string,
  commitSha: string
) {
  const octokit = createGitHubClient(token);

  // async-parallel: ref lookup and commit detail are independent
  const [ref, commitDetail] = await Promise.all([
    octokit.rest.git.getRef({ owner, repo, ref: `heads/${branch}` }),
    octokit.rest.repos.getCommit({ owner, repo, ref: commitSha }),
  ]);
  const headSha = ref.data.object.sha;
  const headCommit = await octokit.rest.git.getCommit({ owner, repo, commit_sha: headSha });

  const files = commitDetail.data.files || [];
  const message = commitDetail.data.commit.message.split("\n")[0];
  const parentSha = commitDetail.data.parents[0]?.sha;

  if (!parentSha) {
    throw new Error("Cannot revert the initial commit");
  }

  if (files.length === 0) {
    throw new Error("No file changes found in the commit");
  }

  // Build tree entries that reverse the changes
  const treeEntries: Array<{
    path: string;
    mode: "100644";
    type: "blob";
    sha: string | null;
  }> = [];

  // Collect parent file lookups for parallel execution (async-parallel)
  const parentLookups: Array<{ lookupPath: string }> = [];

  for (const file of files) {
    if (file.status === "added") {
      treeEntries.push({ path: file.filename, mode: "100644", type: "blob", sha: null });
    } else if (file.status === "renamed" && file.previous_filename) {
      treeEntries.push({ path: file.filename, mode: "100644", type: "blob", sha: null });
      parentLookups.push({ lookupPath: file.previous_filename });
    } else {
      parentLookups.push({ lookupPath: file.filename });
    }
  }

  // async-parallel: batch all parent file lookups instead of sequential awaits
  const lookupResults = await Promise.all(
    parentLookups.map(async ({ lookupPath }) => {
      try {
        const parentFile = await octokit.rest.repos.getContent({
          owner, repo, path: lookupPath, ref: parentSha,
        });
        if (!Array.isArray(parentFile.data) && parentFile.data.type === "file") {
          return { path: lookupPath, sha: parentFile.data.sha };
        }
      } catch { /* file may not exist in parent */ }
      return null;
    })
  );

  for (const result of lookupResults) {
    if (result) {
      treeEntries.push({ path: result.path, mode: "100644", type: "blob", sha: result.sha });
    }
  }

  // Create new tree with reverted changes
  const newTree = await octokit.rest.git.createTree({
    owner,
    repo,
    base_tree: headCommit.data.tree.sha,
    tree: treeEntries,
  });

  // Create the revert commit
  const newCommit = await octokit.rest.git.createCommit({
    owner,
    repo,
    message: `Revert "${message}"`,
    tree: newTree.data.sha,
    parents: [headSha],
  });

  // Update the branch reference
  await octokit.rest.git.updateRef({
    owner,
    repo,
    ref: `heads/${branch}`,
    sha: newCommit.data.sha,
  });

  return { success: true, message: `Reverted ${commitSha.substring(0, 7)} on "${branch}"` };
}

// ─── Tags ───────────────────────────────────────────────────────────────────

export async function getTags(
  token: string,
  owner: string,
  repo: string
) {
  const octokit = createGitHubClient(token);
  const { data } = await octokit.rest.repos.listTags({
    owner,
    repo,
    per_page: 100,
  });

  return data.map((tag) => ({
    name: tag.name,
    hash: tag.commit.sha.substring(0, 7),
    message: "",
    date: "",
    tagger: "",
    isAnnotated: false,
  }));
}

// ─── Diff ───────────────────────────────────────────────────────────────────

export async function getCompare(
  token: string,
  owner: string,
  repo: string,
  from: string,
  to: string
) {
  const octokit = createGitHubClient(token);

  // Get the diff in patch format
  const { data } = await octokit.rest.repos.compareCommits({
    owner,
    repo,
    base: from,
    head: to,
    mediaType: { format: "diff" },
  });

  return {
    diff: typeof data === "string" ? data : "",
    from,
    to,
  };
}

// ─── Status (read-only stub for GitHub) ─────────────────────────────────────

export async function getStatus(
  token: string,
  owner: string,
  repo: string
) {
  // Remote repos don't have working tree status
  const repoData = await createGitHubClient(token).rest.repos.get({
    owner,
    repo,
  });

  return {
    current: repoData.data.default_branch,
    tracking: null,
    ahead: 0,
    behind: 0,
    staged: [],
    modified: [],
    deleted: [],
    untracked: [],
    conflicted: [],
    isClean: true,
  };
}

// ─── File browsing ──────────────────────────────────────────────────────────

export async function getFileTree(
  token: string,
  owner: string,
  repo: string,
  path: string = "",
  ref?: string
) {
  const octokit = createGitHubClient(token);
  const { data } = await octokit.rest.repos.getContent({
    owner,
    repo,
    path,
    ref,
  });

  if (!Array.isArray(data)) {
    return [data];
  }

  return data.map((item) => ({
    name: item.name,
    path: item.path,
    type: item.type,
    size: item.size,
  }));
}

export async function getFileContent(
  token: string,
  owner: string,
  repo: string,
  path: string,
  ref?: string
) {
  const octokit = createGitHubClient(token);
  const { data } = await octokit.rest.repos.getContent({ owner, repo, path, ref });
  if (Array.isArray(data) || data.type !== "file") {
    throw new Error(`Path '${path}' is not a file`);
  }
  const content = Buffer.from(data.content, "base64").toString("utf-8");
  return { path, ref: ref || "default", content, size: data.size };
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function mapGitHubFileStatus(
  status: string
): "A" | "M" | "D" | "R" | "C" | "U" {
  switch (status) {
    case "added":
      return "A";
    case "removed":
      return "D";
    case "renamed":
      return "R";
    case "copied":
      return "C";
    case "modified":
    case "changed":
    default:
      return "M";
  }
}
