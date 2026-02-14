import api from "@/config/axios";
import { GITHUB_API_ENDPOINTS } from "@/config/github-endpoints";

function unwrap<T>(res: { data: { success: boolean; data: T } }): T {
  return res.data.data;
}

// ─── GitHub Files ──────────────────────────────────────────────────────────

export async function getGitHubFileList(owner: string, repo: string, search?: string) {
  return unwrap<{ files: string[] }>(
    await api.get(GITHUB_API_ENDPOINTS.FILES, { params: { owner, repo, search } })
  );
}

export async function getGitHubFileContent(owner: string, repo: string, filePath: string, ref?: string) {
  return unwrap<{ filePath: string; ref: string; content: string; length: number; truncated: boolean }>(
    await api.get(GITHUB_API_ENDPOINTS.FILES_CONTENT, { params: { owner, repo, filePath, ref } })
  );
}
