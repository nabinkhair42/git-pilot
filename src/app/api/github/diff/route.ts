import { NextRequest, NextResponse } from "next/server";
import { getGitHubToken } from "@/lib/auth-helpers";
import { getCompare } from "@/lib/github/client";

export async function GET(request: NextRequest) {
  try {
    const token = await getGitHubToken();
    const { searchParams } = new URL(request.url);
    const owner = searchParams.get("owner");
    const repo = searchParams.get("repo");
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (!owner || !repo || !from || !to) {
      return NextResponse.json(
        { success: false, error: "owner, repo, from, and to are required" },
        { status: 400 }
      );
    }

    const data = await getCompare(token, owner, repo, from, to);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch diff";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
