import { NextRequest } from "next/server";
import { getGitHubToken } from "@/lib/auth/auth-helpers";
import { createGitHubClient } from "@/lib/github/client";
import { successResponse, errorResponse } from "@/lib/response/server-response";

export async function GET(request: NextRequest) {
  try {
    // async-api-routes: start token fetch early, do sync work, await late
    const tokenPromise = getGitHubToken();
    const { searchParams } = new URL(request.url);
    const owner = searchParams.get("owner");
    const repo = searchParams.get("repo");

    if (!owner || !repo) {
      return errorResponse("owner and repo are required", 400);
    }

    const ref = searchParams.get("ref") || undefined;
    const search = searchParams.get("search") || "";

    const token = await tokenPromise;
    const octokit = createGitHubClient(token);

    // Get the default branch SHA if no ref provided
    let treeSha = ref;
    if (!treeSha) {
      const { data: repoData } = await octokit.rest.repos.get({ owner, repo });
      treeSha = repoData.default_branch;
    }

    const { data } = await octokit.rest.git.getTree({
      owner,
      repo,
      tree_sha: treeSha!,
      recursive: "1",
    });

    let files = data.tree
      .filter((item) => item.type === "blob" && item.path)
      .map((item) => item.path!);

    if (search) {
      const lower = search.toLowerCase();
      files = files.filter((f) => f.toLowerCase().includes(lower));
    }

    return successResponse({ files: files.slice(0, 100) });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list files";
    return errorResponse(message);
  }
}
