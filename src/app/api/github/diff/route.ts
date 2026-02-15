import { NextRequest } from "next/server";
import { getGitHubToken } from "@/lib/auth/auth-helpers";
import { getCompare } from "@/lib/github/client";
import { successResponse, errorResponse } from "@/lib/response/server-response";

export async function GET(request: NextRequest) {
  try {
    // async-api-routes: start token fetch early, do sync work, await late
    const tokenPromise = getGitHubToken();
    const { searchParams } = new URL(request.url);
    const owner = searchParams.get("owner");
    const repo = searchParams.get("repo");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (!owner || !repo || !from || !to) {
      return errorResponse("owner, repo, from, and to are required", 400);
    }

    const token = await tokenPromise;
    const data = await getCompare(token, owner, repo, from, to);
    return successResponse(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch diff";
    return errorResponse(message);
  }
}
