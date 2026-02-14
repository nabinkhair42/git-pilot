import { NextRequest, NextResponse } from "next/server";
import { getGitHubToken } from "@/lib/auth-helpers";
import { createGitHubClient } from "@/lib/github/client";

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

    const ref = searchParams.get("ref") || undefined;
    const search = searchParams.get("search") || "";

    const octokit = createGitHubClient(token);

    // Get the default branch SHA if no ref provided
    let treeSha = ref;
    if (!treeSha) {
      const { data: repoData } = await octokit.rest.repos.get({ owner, repo });
      treeSha = repoData.default_branch;
    }

    const { data } = await octokit.rest.git.getTree({
      owner,
      repo,
      tree_sha: treeSha!,
      recursive: "1",
    });

    let files = data.tree
      .filter((item) => item.type === "blob" && item.path)
      .map((item) => item.path!);

    if (search) {
      const lower = search.toLowerCase();
      files = files.filter((f) => f.toLowerCase().includes(lower));
    }

    return NextResponse.json({ success: true, data: { files: files.slice(0, 100) } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to list files";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
