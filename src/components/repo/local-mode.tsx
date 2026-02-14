
import { PathInput } from "@/components/repo/path-input";
import { Button } from "@/components/ui/button";
import { useRecentRepos } from "@/hooks/use-recent-repos";
import { validateRepo } from "@/services/frontend/git.services";
import { ArrowRight, FolderGit2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
export function LocalModeContent() {
  const [path, setPath] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { addRepo } = useRecentRepos();

  async function openRepo(repoPath: string) {
    if (!repoPath.trim()) return;
    setLoading(true);
    try {
      const result = await validateRepo(repoPath.replace(/\/+$/, ""));
      if (result.valid) {
        addRepo(result.path);
        router.push(`/repo/commits?path=${encodeURIComponent(result.path)}`);
      } else {
        toast.error("Not a valid git repository");
      }
    } catch {
      toast.error("Failed to validate repository path");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="mx-auto mt-4 flex w-full max-w-lg flex-col gap-2 px-4 sm:flex-row sm:items-center sm:px-0">
        <PathInput
          value={path}
          onChange={setPath}
          onSubmit={openRepo}
          disabled={loading}
          placeholder="Start typing a path..."
        />

        <Button
          type="button"
          onClick={() => openRepo(path)}
          disabled={!path.trim()}
          isLoading={loading}
          className="h-11 w-full shrink-0 bg-foreground px-5 text-sm font-medium text-background transition-opacity hover:opacity-80 sm:w-auto"
        >
          Open
          <ArrowRight size={16} className="ml-1" />
        </Button>
      </div>

      <p className="mx-auto mt-3 max-w-md px-4 text-xs text-muted-foreground/60 sm:px-0">
        Type a path to see autocomplete suggestions. Git repos are highlighted
        in green.
      </p>
    </>
  );
}

export function RecentRepos({
  repos,
  openRepo,
  removeRepo,
}: {
  repos: string[];
  openRepo: (path: string) => void;
  removeRepo: (path: string) => void;
}) {
  if (repos.length === 0) return null;

  return (
    <div className="rail-bounded">
      <div className="px-4 pb-4 pt-8 sm:px-6">
        <p className="font-medium text-muted-foreground">
          Recent Repositories
        </p>
      </div>
      <div className="grid gap-0 sm:grid-cols-2 border-y border-border">
        {repos.map((repo, i) => (
          <div
            key={repo}
            className={`group flex cursor-pointer items-start gap-3 px-4 py-4 transition-colors hover:bg-muted sm:items-center sm:px-6
              ${i % 2 !== 0 ? "sm:border-l sm:border-dashed sm:border-border" : ""}
              ${i >= 2 ? "sm:border-t sm:border-dashed sm:border-border" : ""}
              ${i >= 1 ? "max-sm:border-t max-sm:border-dashed max-sm:border-border" : ""}
            `}
            onClick={() => openRepo(repo)}
          >
            <FolderGit2 className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground sm:mt-0" />
            <span className="min-w-0 flex-1 break-all text-left font-mono text-sm text-foreground sm:truncate">
              {repo}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeRepo(repo);
              }}
              className="shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-foreground"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export function LocalModeBottom() {
  const { repos, addRepo, removeRepo } = useRecentRepos();
  const router = useRouter();

  async function openRepo(repoPath: string) {
    if (!repoPath.trim()) return;
    try {
      const result = await validateRepo(repoPath.replace(/\/+$/, ""));
      if (result.valid) {
        addRepo(result.path);
        router.push(`/repo/commits?path=${encodeURIComponent(result.path)}`);
      } else {
        toast.error("Not a valid git repository");
      }
    } catch {
      toast.error("Failed to validate repository path");
    }
  }

  if (repos.length === 0) return null;

  return (
    <>
      <div className="mt-16" aria-hidden="true" />
      <RecentRepos repos={repos} openRepo={openRepo} removeRepo={removeRepo} />
    </>
  );
}
