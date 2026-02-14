import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useGitHubRepos } from "@/hooks/use-github";
import { useMode, type GitHubRepo } from "@/hooks/use-mode";
import { signIn, signOut } from "@/lib/auth-client";
import { Lock, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { GitHub } from "../icons/github";
import { LogOut } from "lucide-react";
import { session } from "@/lib/db/schema";

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

  return null;
}

export function GitHubModeBottom({
  session,
  sessionLoading,
}: {
  session: {
    user: { name: string; image?: string | null; email: string };
  } | null;
  sessionLoading: boolean;
}) {
  if (sessionLoading || !session) return null;

  return <GitHubRepoGrid session={session} />;
}

function GitHubRepoGrid({ session }: { session: any }) {
  const { data: repos, isLoading, error } = useGitHubRepos();
  const { setGitHubRepo } = useMode();
  const router = useRouter();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!repos) return [];
    if (!search) return repos;
    const q = search.toLowerCase();
    return repos.filter(
      (r) =>
        r.fullName.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q) ||
        r.language?.toLowerCase().includes(q),
    );
  }, [repos, search]);

  function selectRepo(repo: (typeof filtered)[number]) {
    const ghRepo: GitHubRepo = {
      owner: repo.owner,
      name: repo.name,
      fullName: repo.fullName,
      defaultBranch: repo.defaultBranch,
      isPrivate: repo.isPrivate,
    };
    setGitHubRepo(ghRepo);
    router.push(
      `/repo/commits?mode=github&owner=${encodeURIComponent(repo.owner)}&repo=${encodeURIComponent(repo.name)}`,
    );
  }

  if (isLoading) {
    return (
      <div className="border-t border-border">
        <div className="px-4 pb-4 pt-8 sm:px-6">
          <Skeleton className="h-5 w-40" />
        </div>
        <div className="grid gap-0 border-y border-border sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 px-4 py-4 sm:items-center sm:px-6
                ${i % 2 !== 0 ? "sm:border-l sm:border-dashed sm:border-border" : ""}
                ${i >= 2 ? "sm:border-t sm:border-dashed sm:border-border" : ""}
                ${i >= 1 ? "max-sm:border-t max-sm:border-dashed max-sm:border-border" : ""}
              `}
            >
              <Skeleton className="mt-0.5 size-4 shrink-0 rounded sm:mt-0" />
              <div className="min-w-0 flex-1 space-y-1.5">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-36" />
                  {i % 3 === 0 && <Skeleton className="h-3 w-3 rounded" />}
                  {i % 2 === 0 && (
                    <Skeleton className="h-4 w-14 rounded-full" />
                  )}
                </div>
                <Skeleton
                  className={`h-3 ${["w-3/4", "w-1/2", "w-2/3", "w-3/5", "w-1/2", "w-2/3"][i]}`}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border-t border-border">
        <div className="py-12 text-center text-sm text-muted-foreground">
          Failed to load repositories. Make sure your GitHub connection is
          active.
        </div>
      </div>
    );
  }

  if (!repos || repos.length === 0) return null;

  return (
    <div className="border-t border-border">
      <div className="flex items-center justify-between px-4 pb-4 pt-8 sm:px-6 border-b">
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
        <div className="relative w-48">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="h-8 pl-8 text-xs"
          />
        </div>
      </div>
      <div className="overflow-y-auto h-auto max-h-[450px]">
        <div className="grid gap-0 sm:grid-cols-2">
          {filtered.length === 0 ? (
            <div className="col-span-full py-12 text-center text-sm text-muted-foreground">
              {search ? "No matching repositories" : "No repositories found"}
            </div>
          ) : (
            filtered.map((repo, i) => (
              <div
                key={repo.fullName}
                role="button"
                tabIndex={0}
                onClick={() => selectRepo(repo)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    selectRepo(repo);
                  }
                }}
                className={`group flex cursor-pointer items-start gap-3 px-4 py-4 transition-colors hover:bg-muted sm:items-center sm:px-6
                ${i % 2 !== 0 ? "sm:border-l sm:border-dashed sm:border-border" : ""}
                ${i >= 2 ? "sm:border-t sm:border-dashed sm:border-border" : ""}
                ${i >= 1 ? "max-sm:border-t max-sm:border-dashed max-sm:border-border" : ""}
              `}
              >
                <GitHub className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground sm:mt-0" />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="min-w-0 break-all font-mono text-sm text-foreground sm:truncate">
                      {repo.fullName}
                    </span>
                    {repo.isPrivate && (
                      <Lock className="h-3 w-3 shrink-0 text-muted-foreground" />
                    )}
                    {repo.language && (
                      <Badge
                        variant="secondary"
                        className="shrink-0 text-[10px] font-normal"
                      >
                        {repo.language}
                      </Badge>
                    )}
                  </div>
                  {repo.description && (
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground sm:truncate">
                      {repo.description}
                    </p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
