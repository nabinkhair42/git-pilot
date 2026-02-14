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
  const { data } = await octokit.rest.repos.getCommit({
    owner,
    repo,
    ref: hash,
  });

  const commit = data;
  const stats = commit.stats || { total: 0, additions: 0, deletions: 0 };

  // Get the diff as text
  const diffResponse = await octokit.request(
    "GET /repos/{owner}/{repo}/commits/{ref}",
    {
      owner,
      repo,
      ref: hash,
      headers: { accept: "application/vnd.github.diff" },
    }
  );

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
  const { data } = await octokit.rest.repos.listBranches({
    owner,
    repo,
    per_page: 100,
  });

  // Get the default branch to mark it as current
  const repoData = await octokit.rest.repos.get({ owner, repo });
  const defaultBranch = repoData.data.default_branch;

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
