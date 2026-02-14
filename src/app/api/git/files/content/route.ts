import { NextRequest } from "next/server";
import { getGitClient } from "@/lib/git";
import { MENTION_FILE_CONTENT_MAX_CHARS } from "@/config/constants";
import { successResponse, errorResponse } from "@/lib/response/server-response";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get("path");
  const filePath = searchParams.get("filePath");
  if (!path) return errorResponse("Missing 'path' query parameter", 400);
  if (!filePath) return errorResponse("Missing 'filePath' query parameter", 400);

  const ref = searchParams.get("ref") || "HEAD";

  try {
    const git = getGitClient(path);
    const raw = await git.show([`${ref}:${filePath}`]);
    const content = raw.slice(0, MENTION_FILE_CONTENT_MAX_CHARS);

    return successResponse({
      filePath,
      ref,
      content,
      length: raw.length,
      truncated: raw.length > MENTION_FILE_CONTENT_MAX_CHARS,
    });
  } catch (e) {
    return errorResponse(e instanceof Error ? e.message : "Failed to read file");
  }
}
