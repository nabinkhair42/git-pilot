import { NextRequest, NextResponse } from "next/server";
import { getGitHubToken } from "@/lib/auth-helpers";
import { getBranches } from "@/lib/github/client";

export async function GET(request: NextRequest) {
  try {
    const token = await getGitHubToken();
    const { searchParams } = new URL(request.url);
    const owner = searchParams.get("owner");
    const repo = searchParams.get("repo");

    if (!owner || !repo) {
      return NextResponse.json(
        { success: false, error: "owner and repo are required" },
        { status: 400 }
      );
    }

    const data = await getBranches(token, owner, repo);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch branches";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
