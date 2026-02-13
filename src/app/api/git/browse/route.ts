import { NextRequest } from "next/server";
import { readdir } from "node:fs/promises";
import { resolve, dirname, basename } from "node:path";
import { existsSync } from "node:fs";
import { successResponse } from "@/lib/response/server-response";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const partial = searchParams.get("path") || "";

  if (!partial || !partial.startsWith("/")) {
    return successResponse({ suggestions: [] });
  }

  try {
    let parentDir: string;
    let prefix: string;

    // Only list children when the path explicitly ends with "/"
    // Otherwise, treat the last segment as a prefix to filter siblings
    if (partial.endsWith("/")) {
      parentDir = resolve(partial);
      prefix = "";
    } else {
      parentDir = dirname(resolve(partial));
      prefix = basename(resolve(partial)).toLowerCase();
    }

    if (!existsSync(parentDir)) {
      return successResponse({ suggestions: [] });
    }

    const entries = await readdir(parentDir, { withFileTypes: true });

    const dirs = entries
      .filter((e) => {
        if (!e.isDirectory()) return false;
        // Hide dotfiles unless the user is typing a dot prefix
        if (e.name.startsWith(".") && !prefix.startsWith(".")) return false;
        if (prefix && !e.name.toLowerCase().startsWith(prefix)) return false;
        return true;
      })
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, 20)
      .map((e) => {
        const fullPath = resolve(parentDir, e.name);
        const isGitRepo = existsSync(resolve(fullPath, ".git"));
        return { path: fullPath, name: e.name, isGitRepo };
      });

    return successResponse({ suggestions: dirs });
  } catch {
    return successResponse({ suggestions: [] });
  }
}
