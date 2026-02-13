import { NextRequest, NextResponse } from "next/server";
import { getGitHubToken } from "@/lib/auth-helpers";
import { getUserRepos, getRepoInfo } from "@/lib/github/client";

export async function GET(request: NextRequest) {
  try {
    const token = await getGitHubToken();
    const { searchParams } = new URL(request.url);
    const owner = searchParams.get("owner");
    const repo = searchParams.get("repo");

    // If owner+repo specified, return repo info; otherwise list all repos
    if (owner && repo) {
      const data = await getRepoInfo(token, owner, repo);
      return NextResponse.json({ success: true, data });
    }

    const repos = await getUserRepos(token);
    return NextResponse.json({ success: true, data: repos });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch repos";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
