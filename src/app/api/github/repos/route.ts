import { NextRequest } from "next/server";
import { getGitHubToken } from "@/lib/auth/auth-helpers";
import { getUserRepos, getRepoInfo } from "@/lib/github/client";
import { successResponse, errorResponse } from "@/lib/response/server-response";

export async function GET(request: NextRequest) {
  try {
    // async-api-routes: start token fetch early, do sync work, await late
    const tokenPromise = getGitHubToken();
    const { searchParams } = new URL(request.url);
    const owner = searchParams.get("owner");
    const repo = searchParams.get("repo");

    const token = await tokenPromise;

    // If owner+repo specified, return repo info; otherwise list all repos
    if (owner && repo) {
      const data = await getRepoInfo(token, owner, repo);
      return successResponse(data);
    }

    const repos = await getUserRepos(token);
    return successResponse(repos);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch repos";
    return errorResponse(message);
  }
}
