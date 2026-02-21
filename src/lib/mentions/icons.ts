import { FileText, GitCommitHorizontal, GitBranch, Tag, FolderGit2 } from "lucide-react";
import type { MentionCategory } from "./types";

export const CATEGORY_ICONS: Record<MentionCategory, React.ComponentType<{ className?: string }>> = {
  file: FileText,
  commit: GitCommitHorizontal,
  branch: GitBranch,
  tag: Tag,
  repository: FolderGit2,
};
