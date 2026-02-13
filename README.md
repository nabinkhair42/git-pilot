# Git Commit Manager

A local web-based GUI for managing Git repositories. Point it at any repo on your machine and get a clean, dark-mode interface for browsing history, managing branches, comparing diffs, and performing operations -- without memorizing CLI flags and commit hashes.

## Why

Git is powerful but unforgiving from the command line. A wrong `git reset --hard` loses work. Cherry-picking requires copy-pasting hashes. Comparing arbitrary commits means juggling flags. This tool wraps all of that in a visual interface with built-in safety nets.

## What You Can Do

- **Browse commit history** with search, branch filtering, and pagination
- **View detailed diffs** for any commit, or compare any two commits side-by-side (unified or split view)
- **Reset, cherry-pick, and revert** commits with safety-tiered confirmation dialogs (destructive operations require typed confirmation)
- **Manage branches** -- create, switch, delete, force-delete, and merge, with both local and remote branches visible
- **Manage tags** -- create lightweight or annotated tags, search/filter, delete
- **Stash changes** -- save, apply, pop, drop, or clear stashes from the UI
- **Copy commit hashes** with a single click
- **Navigate with keyboard shortcuts** -- press 1-5 to jump between pages

## How It Works

Runs entirely on localhost. You open the app, type a path (with autocomplete), and it connects to that repo using `simple-git`. No database, no accounts, no cloud. All state comes from Git itself. Recent repos are remembered in localStorage for quick access.

Each repo is identified by its path in the URL (`?path=/abs/path`), so you can have multiple repos open in different browser tabs, and every view is bookmarkable.

## Safety

Operations are grouped into tiers:

| Tier | Examples | Safeguard |
|------|----------|-----------|
| Safe | Log, diff, status | None |
| Moderate | Cherry-pick, revert, merge | Confirmation dialog |
| Dangerous | Soft/mixed reset, delete branch | Warning + confirmation |
| Critical | Hard reset, force-delete branch | Typed confirmation required |

## Getting Started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) and enter a path to any local Git repository.

## Tech

Next.js, TypeScript, Tailwind CSS, shadcn/ui, simple-git, SWR, diff2html.
