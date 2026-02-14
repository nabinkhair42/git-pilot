export interface CommitInfo {
  hash: string;
  abbreviatedHash: string;
  message: string;
  body: string;
  authorName: string;
  authorEmail: string;
  date: string;
  refs: string;
  parentHashes: string[];
}

export interface CommitDetail extends CommitInfo {
  diff: string;
  stats: {
    changed: number;
    insertions: number;
    deletions: number;
  };
  files: FileChange[];
}

export interface FileChange {
  file: string;
  changes: number;
  insertions: number;
  deletions: number;
  binary: boolean;
  status: "A" | "M" | "D" | "R" | "C" | "U";
}

export interface BranchInfo {
  name: string;
  current: boolean;
  commit: string;
  label: string;
  linkedWorkTree: boolean;
  isRemote: boolean;
}

export interface DiffResult {
  diff: string;
  from: string;
  to: string;
}

export type ResetMode = "soft" | "mixed" | "hard";

export interface TagInfo {
  name: string;
  hash: string;
  message: string;
  date: string;
  tagger: string;
  isAnnotated: boolean;
}
