import { NextRequest, NextResponse } from "next/server";
import { getGitHubToken } from "@/lib/auth-helpers";
import { createGitHubClient } from "@/lib/github/client";
import { MENTION_FILE_CONTENT_MAX_CHARS } from "@/config/constants";

export async function GET(request: NextRequest) {
  try {
    const token = await getGitHubToken();
    const { searchParams } = new URL(request.url);
    const owner = searchParams.get("owner");
    const repo = searchParams.get("repo");
    const filePath = searchParams.get("filePath");

    if (!owner || !repo || !filePath) {
      return NextResponse.json(
        { success: false, error: "owner, repo, and filePath are required" },
        { status: 400 }
      );
    }

    const ref = searchParams.get("ref") || undefined;

    const octokit = createGitHubClient(token);
    const { data } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path: filePath,
      ref,
    });

    if (Array.isArray(data) || data.type !== "file") {
      return NextResponse.json(
        { success: false, error: "Path is not a file" },
        { status: 400 }
      );
    }

    const raw = Buffer.from(data.content, "base64").toString("utf-8");
    const content = raw.slice(0, MENTION_FILE_CONTENT_MAX_CHARS);

    return NextResponse.json({
      success: true,
      data: {
        filePath,
        ref: ref || "default",
        content,
        length: raw.length,
        truncated: raw.length > MENTION_FILE_CONTENT_MAX_CHARS,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to read file";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
