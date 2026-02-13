import { NextRequest, NextResponse } from "next/server";
import { getGitHubToken } from "@/lib/auth-helpers";
import { getCommits } from "@/lib/github/client";

export async function GET(request: NextRequest) {
  try {
    const token = await getGitHubToken();
    const { searchParams } = new URL(request.url);
    const owner = searchParams.get("owner");
    const repo = searchParams.get("repo");
    const branch = searchParams.get("branch") || undefined;
    const maxCount = Number(searchParams.get("maxCount")) || 50;

    if (!owner || !repo) {
      return NextResponse.json(
        { success: false, error: "owner and repo are required" },
        { status: 400 }
      );
    }

    const data = await getCommits(token, owner, repo, { branch, maxCount });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch commits";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
