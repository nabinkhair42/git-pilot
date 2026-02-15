import { NextRequest } from "next/server";
import { getGitHubToken } from "@/lib/auth/auth-helpers";
import { revertCommit } from "@/lib/github/client";
import { successResponse, errorResponse } from "@/lib/response/server-response";

export async function POST(request: NextRequest) {
  try {
    // async-parallel: token fetch and body parse are independent
    const [token, { owner, repo, branch, hash }] = await Promise.all([
      getGitHubToken(),
      request.json(),
    ]);

    if (!owner || !repo || !branch || !hash) {
      return errorResponse("owner, repo, branch, and hash are required", 400);
    }

    const data = await revertCommit(token, owner, repo, branch, hash);
    return successResponse(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Revert failed";
    return errorResponse(message);
  }
}
