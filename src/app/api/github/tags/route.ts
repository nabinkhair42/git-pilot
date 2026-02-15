import { NextRequest } from "next/server";
import { getGitHubToken } from "@/lib/auth/auth-helpers";
import { getTags } from "@/lib/github/client";
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
    const data = await getTags(token, owner, repo);
    return successResponse(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch tags";
    return errorResponse(message);
  }
}
