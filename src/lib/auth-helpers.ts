import { auth } from "@/lib/auth";
import { headers } from "next/headers";

/**
 * Get the authenticated session from the request.
 * Returns null if not authenticated.
 */
export async function getAuthSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
}

/**
 * Get the GitHub access token for the authenticated user.
 * Throws if not authenticated or token not available.
 */
export async function getGitHubToken(): Promise<string> {
  const session = await getAuthSession();
  if (!session) {
    throw new Error("Not authenticated");
  }

  const result = await auth.api.getAccessToken({
    body: {
      providerId: "github",
    },
    headers: await headers(),
  });

  if (!result?.accessToken) {
    throw new Error("GitHub access token not available");
  }

  return result.accessToken;
}
