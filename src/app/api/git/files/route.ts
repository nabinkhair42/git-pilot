import { NextRequest } from "next/server";
import { getGitClient } from "@/lib/git";
import { successResponse, errorResponse } from "@/lib/response/server-response";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get("path");
  if (!path) return errorResponse("Missing 'path' query parameter", 400);

  const ref = searchParams.get("ref") || "HEAD";
  const search = searchParams.get("search") || "";

  try {
    const git = getGitClient(path);
    const result = await git.raw(["ls-tree", "-r", "--name-only", ref]);
    let files = result.split("\n").filter(Boolean);

    if (search) {
      const lower = search.toLowerCase();
      files = files.filter((f) => f.toLowerCase().includes(lower));
    }

    return successResponse({ files: files.slice(0, 100) });
  } catch (e) {
    return errorResponse(e instanceof Error ? e.message : "Failed to list files");
  }
}
