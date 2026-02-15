import { NextRequest } from "next/server";
import { getGitHubToken } from "@/lib/auth/auth-helpers";
import { createGitHubClient } from "@/lib/github/client";
import { MENTION_FILE_CONTENT_MAX_CHARS } from "@/config/constants";
import { successResponse, errorResponse } from "@/lib/response/server-response";

export async function GET(request: NextRequest) {
  try {
    // async-api-routes: start token fetch early, do sync work, await late
    const tokenPromise = getGitHubToken();
    const { searchParams } = new URL(request.url);
    const owner = searchParams.get("owner");
    const repo = searchParams.get("repo");
    const filePath = searchParams.get("filePath");

    if (!owner || !repo || !filePath) {
      return errorResponse("owner, repo, and filePath are required", 400);
    }

    const ref = searchParams.get("ref") || undefined;

    const token = await tokenPromise;
    const octokit = createGitHubClient(token);
    const { data } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path: filePath,
      ref,
    });

    if (Array.isArray(data) || data.type !== "file") {
      return errorResponse("Path is not a file", 400);
    }

    const raw = Buffer.from(data.content, "base64").toString("utf-8");
    const content = raw.slice(0, MENTION_FILE_CONTENT_MAX_CHARS);

    return successResponse({
      filePath,
      ref: ref || "default",
      content,
      length: raw.length,
      truncated: raw.length > MENTION_FILE_CONTENT_MAX_CHARS,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to read file";
    return errorResponse(message);
  }
}
