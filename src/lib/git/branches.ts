import type { SimpleGit } from "simple-git";
import type { BranchInfo, OperationResult } from "./types";

export async function getBranches(git: SimpleGit): Promise<BranchInfo[]> {
  const summary = await git.branch(["-a", "--sort=-committerdate"]);
  return Object.entries(summary.branches)
    .filter(([name]) => !name.includes("HEAD"))
    .map(([name, data]) => {
      const isRemote = name.startsWith("remotes/");
      return {
        name: isRemote ? name.replace(/^remotes\//, "") : name,
        current: data.current,
        commit: data.commit,
        label: data.label,
        linkedWorkTree: data.linkedWorkTree,
        isRemote,
      };
    });
}

export async function createBranch(
  git: SimpleGit,
  name: string,
  startPoint?: string
): Promise<OperationResult> {
  try {
    if (startPoint) {
      await git.checkoutBranch(name, startPoint);
    } else {
      await git.checkoutLocalBranch(name);
    }
    return { success: true, message: `Branch '${name}' created and checked out` };
  } catch (e) {
    return {
      success: false,
      message: e instanceof Error ? e.message : "Failed to create branch",
    };
  }
}

export async function deleteBranch(
  git: SimpleGit,
  name: string,
  force: boolean = false
): Promise<OperationResult> {
  try {
    if (force) {
      await git.raw(["branch", "-D", name]);
    } else {
      await git.deleteLocalBranch(name);
    }
    return { success: true, message: `Branch '${name}' deleted` };
  } catch (e) {
    return {
      success: false,
      message: e instanceof Error ? e.message : "Failed to delete branch",
    };
  }
}

export async function checkoutBranch(
  git: SimpleGit,
  name: string
): Promise<OperationResult> {
  try {
    await git.checkout(name);
    return { success: true, message: `Switched to branch '${name}'` };
  } catch (e) {
    return {
      success: false,
      message: e instanceof Error ? e.message : "Failed to checkout branch",
    };
  }
}

export async function mergeBranch(
  git: SimpleGit,
  source: string
): Promise<OperationResult> {
  try {
    const result = await git.merge([source]);
    return {
      success: true,
      message: result.result ?? `Merged '${source}' successfully`,
    };
  } catch (e) {
    return {
      success: false,
      message: e instanceof Error ? e.message : "Merge failed",
    };
  }
}
