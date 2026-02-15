# GitPilot

## What It Is

An AI-powered visual Git client for managing repositories. Works in two modes: **Local** (connects to repos on your machine via simple-git) and **GitHub** (manages repos from your GitHub account via Octokit). Runs as a Next.js app. Includes an AI chat assistant with inline `@` mentions for natural language repo exploration.

## The Problem

Managing Git history through the CLI can be tedious and error-prone, especially for operations like:
- Resetting to a previous commit (soft/mixed/hard)
- Cherry-picking commits between branches
- Reverting specific commits
- Comparing diffs between arbitrary commits
- Managing branches (create, switch, delete local and remote, merge)
- Managing tags and stashes

These operations require remembering exact hashes, flags, and sequences. A single mistake with `git reset --hard` can lose work.

## The Solution

A polished dark-mode web UI that wraps Git operations with:
- Visual commit history with search and filtering
- Side-by-side diff viewing (unified or split) for any two commits
- Cherry-pick, revert, and reset operations in both local and GitHub modes
- Branch management with local and remote branch support (including remote branch deletion)
- Tag management (lightweight and annotated)
- Stash management (save, apply, pop, drop, clear)
- Safety tiers with appropriate confirmation dialogs (typed confirmation for destructive operations)
- Multi-repo support via URL parameters, bookmarkable views
- GitHub mode with full read/write operations via GitHub API
- **AI Chat**: Natural language repo assistant with inline `@` mention system for referencing files, commits, branches, tags, stashes, and repositories
- Chat works without a selected repo (use `@repo:` to reference any repository)
- **File Management**: Create, update, and delete files directly in GitHub repos via chat (with approval flow)
- **Releases**: Create GitHub releases with tags, titles, and markdown release notes from chat
- **Repository Creation**: Create new GitHub repos (public/private) with README, .gitignore, and license from chat
- **Repository Deletion**: Permanently delete GitHub repositories from chat (with approval flow)
- **Branch Merging**: Merge branches in GitHub repos from chat with optional custom commit messages (with approval flow)
- Fully responsive design across all screen sizes

## How It Works

**Local mode**: Standalone Next.js app running on localhost. Enter a repo path (with autocomplete), and it connects using `simple-git`. No cloud, all state comes from Git. Recent repos stored in localStorage.

**GitHub mode**: Sign in with GitHub OAuth. Browse and manage your repositories: view commits, branches, tags, diffs, and perform write operations (branch deletion, cherry-pick, revert, reset) via the GitHub API. Auth managed by better-auth with Neon Postgres for session storage. All 11 API routes use standardized server-response helpers with async parallelization for faster loading.

**AI Chat**: Available on all pages, even without a repo selected. An inline `@` mention system lets you reference repo entities (files, commits, branches, tags, stashes, repos) with category shortcuts like `@file:`, `@commit:`, `@branch:`. Cross-category search with bare `@` queries. The AI uses multi-step tool calling to chain operations and answer complex questions.

Each repo is identified by path (local) or owner/name (GitHub) in the URL, so multiple repos can be open in different tabs.

## Tech Stack

- Next.js 16.x (App Router)
- TypeScript
- React 19.x
- Tailwind CSS v4 (postcss plugin, no config file)
- shadcn/ui components (radix-ui primitives)
- simple-git (local Git operations)
- Octokit (GitHub API)
- better-auth (authentication with GitHub OAuth)
- Drizzle ORM + Neon Postgres (auth persistence)
- SWR (data fetching)
- diff2html (diff rendering)
- axios (HTTP client)
- zod (validation)
- AI SDK 6 by Vercel (`ai`, `@ai-sdk/openai`, `@ai-sdk/react`)
- react-markdown (chat message rendering)
- date-fns (date formatting)
- next-themes (dark/light mode)
- sonner (toast notifications)
- lucide-react (icons)
