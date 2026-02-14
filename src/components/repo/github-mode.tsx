import { GitHubRepoPicker } from "@/components/github/repo-picker";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { signIn, signOut } from "@/lib/auth-client";
import { useState } from "react";
import { GitHub } from "../icons/github";
import { LogOut } from "lucide-react";
export function GitHubModeContent({
  session,
  sessionLoading,
}: {
  session: {
    user: { name: string; image?: string | null; email: string };
  } | null;
  sessionLoading: boolean;
}) {
  const [signInLoading, setSignInLoading] = useState(false);
  const [signOutLoading, setSignOutLoading] = useState(false);

  if (sessionLoading) {
    return (
      <div className="mt-2">
        {/* User info bar skeleton */}
        <div className="mx-auto mb-6 flex max-w-2xl items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-2.5">
          <div className="flex items-center gap-3">
            <Skeleton className="h-7 w-7 rounded-full" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-8 w-20 rounded-md" />
        </div>

        {/* Repo picker skeleton */}
        <div className="mx-auto w-full max-w-2xl">
          <Skeleton className="mb-4 h-11 w-full rounded-md" />
          <div className="rounded-lg border border-border">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 px-4 py-3.5 ${
                  i !== 0 ? "border-t border-border" : ""
                }`}
              >
                <div className="min-w-0 flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-14 rounded-full" />
                  </div>
                  <Skeleton className="h-3 w-3/4" />
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-3 w-10" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="mx-auto max-w-sm py-8">
        <p className="mb-6 text-sm text-muted-foreground">
          Sign in with GitHub to browse your repositories, view commit history,
          and explore diffs — all from the browser.
        </p>
        <Button
          onClick={() => {
            setSignInLoading(true);
            signIn.social({ provider: "github", callbackURL: "/?mode=github" });
          }}
          isLoading={signInLoading}
          className="h-11 gap-2 bg-foreground px-6 text-sm font-medium text-background transition-opacity hover:opacity-80"
        >
          <GitHub className="size-4" /> Sign in with GitHub
        </Button>
      </div>
    );
  }

  return (
    <div className="mt-2 px-2">
      {/* User info bar */}
      <div className="mx-auto mb-6 flex max-w-2xl flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-3">
          {session.user.image && (
            <img
              src={session.user.image}
              alt=""
              className="h-7 w-7 shrink-0 rounded-full"
            />
          )}
          <div className="min-w-0 text-left">
            <span className="block truncate text-sm text-foreground">
              {session.user.name}
            </span>
            <span className="block truncate text-xs text-muted-foreground">
              {session.user.email}
            </span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-muted-foreground"
          isLoading={signOutLoading}
          onClick={() => {
            setSignOutLoading(true);
            signOut();
          }}
        >
          <LogOut size={12} className="mr-1" />
          Sign out
        </Button>
      </div>

      {/* Repo picker */}
      <GitHubRepoPicker />
    </div>
  );
}
