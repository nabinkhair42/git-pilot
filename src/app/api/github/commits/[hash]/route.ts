import { NextRequest } from "next/server";
import { getGitHubToken } from "@/lib/auth/auth-helpers";
import { getCommitDetail } from "@/lib/github/client";
import { successResponse, errorResponse } from "@/lib/response/server-response";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ hash: string }> }
) {
  try {
    // async-parallel: token fetch and params resolve are independent
    const [token, { hash }] = await Promise.all([
      getGitHubToken(),
      params,
    ]);
    const { searchParams } = new URL(request.url);
    const owner = searchParams.get("owner");
    const repo = searchParams.get("repo");

    if (!owner || !repo) {
      return errorResponse("owner and repo are required", 400);
    }

    const data = await getCommitDetail(token, owner, repo, hash);
    return successResponse(data);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch commit detail";
    return errorResponse(message);
  }
}
