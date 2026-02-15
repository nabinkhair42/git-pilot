import { NextRequest } from "next/server";
import { getGitHubToken } from "@/lib/auth/auth-helpers";
import { getBranches, deleteBranch } from "@/lib/github/client";
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

    const token = await tokenPromise;
    const data = await getBranches(token, owner, repo);
    return successResponse(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch branches";
    return errorResponse(message);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // async-parallel: token fetch and body parse are independent
    const [token, { owner, repo, name }] = await Promise.all([
      getGitHubToken(),
      request.json(),
    ]);

    if (!owner || !repo || !name) {
      return errorResponse("owner, repo, and name are required", 400);
    }

    const data = await deleteBranch(token, owner, repo, name);
    return successResponse(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to delete branch";
    return errorResponse(message);
  }
}
