import type { ReactNode } from "react";
import { RepoOverviewRenderer } from "./repo-overview-renderer";
import { CommitHistoryRenderer } from "./commit-history-renderer";
import { CommitDetailRenderer } from "./commit-detail-renderer";
import { BranchListRenderer } from "./branch-list-renderer";
import { TagListRenderer } from "./tag-list-renderer";
import { CompareDiffRenderer } from "./compare-diff-renderer";
import { FileListRenderer } from "./file-list-renderer";
import { FileContentRenderer } from "./file-content-renderer";
import { WriteResultRenderer } from "./write-result-renderer";

export interface ToolRendererProps {
  output: unknown;
  input: unknown;
  onAction: (message: string) => void;
}

export type ToolRenderer = (props: ToolRendererProps) => ReactNode;

export const toolRenderers: Record<string, ToolRenderer> = {
  getRepoOverview: RepoOverviewRenderer,
  getCommitHistory: CommitHistoryRenderer,
  getCommitDetails: CommitDetailRenderer,
  listBranches: BranchListRenderer,
  listTags: TagListRenderer,
  compareDiff: CompareDiffRenderer,
  listFiles: FileListRenderer,
  getFileContent: FileContentRenderer,
  createBranch: WriteResultRenderer,
  deleteBranch: WriteResultRenderer,
  cherryPickCommits: WriteResultRenderer,
  revertCommits: WriteResultRenderer,
  resetBranch: WriteResultRenderer,
};
