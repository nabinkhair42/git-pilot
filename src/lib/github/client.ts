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

export async function mergeBranch(
  token: string,
  owner: string,
  repo: string,
  base: string,
  head: string,
  options: { commitMessage?: string } = {}
) {
  const octokit = createGitHubClient(token);
  const { data } = await octokit.rest.repos.merge({
    owner,
    repo,
    base,
    head,
    commit_message: options.commitMessage,
  });

  return {
    success: true,
    message: `Merged "${head}" into "${base}" (${data.sha.substring(0, 7)})`,
  };
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

// ─── Contributors ────────────────────────────────────────────────────────────

export async function getContributors(
  token: string,
  owner: string,
  repo: string,
  options: { maxCount?: number } = {}
) {
  const octokit = createGitHubClient(token);
  const perPage = Math.min(options.maxCount || 30, 100);
  const { data } = await octokit.rest.repos.listContributors({
    owner,
    repo,
    per_page: perPage,
  });

  return (data || []).map((contributor) => ({
    username: contributor.login || "Unknown",
    avatarUrl: contributor.avatar_url || "",
    contributions: contributor.contributions,
    type: contributor.type || "User",
    profileUrl: contributor.html_url || `https://github.com/${contributor.login || "ghost"}`,
  }));
}

// ─── User Profiles ───────────────────────────────────────────────────────────

export async function getUserProfile(token: string, username: string) {
  const octokit = createGitHubClient(token);
  const { data } = await octokit.rest.users.getByUsername({ username });

  return {
    username: data.login,
    name: data.name || null,
    avatarUrl: data.avatar_url,
    bio: data.bio || null,
    company: data.company || null,
    location: data.location || null,
    blog: data.blog || null,
    twitterUsername: data.twitter_username || null,
    publicRepos: data.public_repos,
    publicGists: data.public_gists,
    followers: data.followers,
    following: data.following,
    createdAt: data.created_at,
    profileUrl: data.html_url,
    type: data.type,
  };
}

// ─── Repository Management ──────────────────────────────────────────────────

export async function createRepository(
  token: string,
  name: string,
  options: {
    description?: string;
    isPrivate?: boolean;
    autoInit?: boolean;
    gitignoreTemplate?: string;
    license?: string;
  } = {}
) {
  const octokit = createGitHubClient(token);
  const { data } = await octokit.rest.repos.createForAuthenticatedUser({
    name,
    description: options.description,
    private: options.isPrivate ?? false,
    auto_init: options.autoInit ?? true,
    gitignore_template: options.gitignoreTemplate,
    license_template: options.license,
  });

  return {
    success: true,
    message: `Repository "${data.full_name}" created successfully`,
    owner: data.owner.login,
    name: data.name,
    fullName: data.full_name,
    url: data.html_url,
    defaultBranch: data.default_branch,
    isPrivate: data.private,
  };
}

export async function deleteRepository(token: string, owner: string, repo: string) {
  const octokit = createGitHubClient(token);
  await octokit.rest.repos.delete({ owner, repo });
  return {
    success: true,
    message: `Repository "${owner}/${repo}" has been permanently deleted`,
  };
}

// ─── File Management ────────────────────────────────────────────────────────

export async function createOrUpdateFile(
  token: string,
  owner: string,
  repo: string,
  path: string,
  content: string,
  message: string,
  options: { branch?: string; sha?: string } = {}
) {
  const octokit = createGitHubClient(token);
  const { data } = await octokit.rest.repos.createOrUpdateFileContents({
    owner,
    repo,
    path,
    message,
    content: Buffer.from(content).toString("base64"),
    branch: options.branch,
    sha: options.sha,
  });

  return {
    success: true,
    message: options.sha
      ? `File "${path}" updated successfully`
      : `File "${path}" created successfully`,
    path,
    sha: data.content?.sha ?? "",
    commitSha: data.commit.sha ?? "",
    commitUrl: data.commit.html_url ?? "",
  };
}

export async function deleteFile(
  token: string,
  owner: string,
  repo: string,
  path: string,
  message: string,
  sha: string,
  options: { branch?: string } = {}
) {
  const octokit = createGitHubClient(token);
  const { data } = await octokit.rest.repos.deleteFile({
    owner,
    repo,
    path,
    message,
    sha,
    branch: options.branch,
  });

  return {
    success: true,
    message: `File "${path}" deleted successfully`,
    path,
    commitSha: data.commit.sha ?? "",
  };
}

// ─── Releases ───────────────────────────────────────────────────────────────

export async function createRelease(
  token: string,
  owner: string,
  repo: string,
  tagName: string,
  options: {
    name?: string;
    body?: string;
    draft?: boolean;
    prerelease?: boolean;
    targetBranch?: string;
  } = {}
) {
  const octokit = createGitHubClient(token);
  const { data } = await octokit.rest.repos.createRelease({
    owner,
    repo,
    tag_name: tagName,
    name: options.name,
    body: options.body,
    draft: options.draft ?? false,
    prerelease: options.prerelease ?? false,
    target_commitish: options.targetBranch,
  });

  return {
    success: true,
    message: `Release "${tagName}" created successfully`,
    tagName: data.tag_name,
    name: data.name ?? "",
    url: data.html_url,
    id: data.id,
    draft: data.draft,
    prerelease: data.prerelease,
  };
}

// ─── Pull Requests ──────────────────────────────────────────────────────────

export async function listPullRequests(
  token: string,
  owner: string,
  repo: string,
  options: { state?: "open" | "closed" | "all"; maxCount?: number } = {}
) {
  const octokit = createGitHubClient(token);
  const { data } = await octokit.rest.pulls.list({
    owner,
    repo,
    state: options.state || "open",
    sort: "updated",
    direction: "desc",
    per_page: Math.min(options.maxCount || 30, 100),
  });

  return data.map((pr) => ({
    number: pr.number,
    title: pr.title,
    state: pr.merged_at ? "merged" : pr.state,
    author: pr.user?.login || "unknown",
    createdAt: pr.created_at,
    updatedAt: pr.updated_at,
    draft: pr.draft || false,
    labels: pr.labels.map((l) => (typeof l === "string" ? l : l.name || "")),
    head: pr.head.ref,
    base: pr.base.ref,
    url: pr.html_url,
  }));
}

export async function getPullRequestDetail(
  token: string,
  owner: string,
  repo: string,
  pullNumber: number
) {
  const octokit = createGitHubClient(token);

  // async-parallel: all three requests are independent
  const [{ data: pr }, { data: reviews }, { data: files }] = await Promise.all([
    octokit.rest.pulls.get({ owner, repo, pull_number: pullNumber }),
    octokit.rest.pulls.listReviews({ owner, repo, pull_number: pullNumber }),
    octokit.rest.pulls.listFiles({ owner, repo, pull_number: pullNumber }),
  ]);

  return {
    number: pr.number,
    title: pr.title,
    body: pr.body || "",
    state: pr.merged_at ? "merged" : pr.state,
    merged: pr.merged,
    mergeable: pr.mergeable,
    draft: pr.draft || false,
    author: pr.user?.login || "unknown",
    authorAvatarUrl: pr.user?.avatar_url || "",
    createdAt: pr.created_at,
    updatedAt: pr.updated_at,
    mergedAt: pr.merged_at,
    mergedBy: pr.merged_by?.login || null,
    commits: pr.commits,
    additions: pr.additions,
    deletions: pr.deletions,
    changedFiles: pr.changed_files,
    head: pr.head.ref,
    base: pr.base.ref,
    labels: pr.labels.map((l) => l.name || ""),
    reviews: reviews.map((r) => ({
      user: r.user?.login || "unknown",
      avatarUrl: r.user?.avatar_url || "",
      state: r.state,
      submittedAt: r.submitted_at || "",
    })),
    files: files.map((f) => ({
      filename: f.filename,
      status: f.status,
      additions: f.additions,
      deletions: f.deletions,
      changes: f.changes,
    })),
    url: pr.html_url,
  };
}

export async function createPullRequest(
  token: string,
  owner: string,
  repo: string,
  title: string,
  head: string,
  base: string,
  options: { body?: string; draft?: boolean } = {}
) {
  const octokit = createGitHubClient(token);
  const { data } = await octokit.rest.pulls.create({
    owner,
    repo,
    title,
    head,
    base,
    body: options.body,
    draft: options.draft ?? false,
  });

  return {
    success: true,
    message: `Pull request #${data.number} "${data.title}" created successfully`,
    number: data.number,
    title: data.title,
    url: data.html_url,
    draft: data.draft,
  };
}

export async function mergePullRequest(
  token: string,
  owner: string,
  repo: string,
  pullNumber: number,
  options: {
    mergeMethod?: "merge" | "squash" | "rebase";
    commitTitle?: string;
    commitMessage?: string;
  } = {}
) {
  const octokit = createGitHubClient(token);
  const { data } = await octokit.rest.pulls.merge({
    owner,
    repo,
    pull_number: pullNumber,
    merge_method: options.mergeMethod || "merge",
    commit_title: options.commitTitle,
    commit_message: options.commitMessage,
  });

  return {
    success: data.merged,
    message: data.message,
    sha: data.sha,
  };
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
