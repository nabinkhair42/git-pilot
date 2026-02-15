# GitPilot

An AI-powered visual Git client that works with local repositories and GitHub. Browse history, manage branches and tags, cherry-pick, revert, reset, compare diffs, stash changes, and chat with an AI assistant that has full repo context.

## Two Modes

- **Local mode** — point it at any repo on your machine. Full read/write access: commits, branches, tags, stashes, cherry-pick, revert, reset, and more.
- **GitHub mode** — sign in with GitHub OAuth and manage your remote repositories. View and operate on commits, branches, tags, and diffs through the GitHub API.

## Features

### Commit Management
- Browse commit history with search, branch filtering, and pagination
- View detailed diffs for any commit (unified or split view with toggle icons)
- Cherry-pick commits onto the current branch
- Revert commits by creating undo commits
- Reset branch to any commit (soft, mixed, or hard)
- Copy commit hashes with a single click

### Branch Management
- Create, switch, delete (local and remote), force-delete, and merge branches
- Branch deletion supported in both local and GitHub modes

### Tag Management
- Create lightweight or annotated tags
- Search, filter, and delete tags

### Stash Management (Local Mode)
- Save, apply, pop, drop, or clear stashes from the UI

### Diff & Compare
- Compare any two commits side-by-side
- Switch between unified and split diff views
- Diff view with proper line numbers and overflow handling

### AI Chat Assistant
- Built-in chat sidebar with AI that has full repo context
- Inline `@` mention system to reference files, commits, branches, tags, stashes, and repositories
- Category shortcuts: `@file:`, `@commit:`, `@branch:`, `@tag:`, `@stash:`, `@repo:`
- Cross-category search with bare `@` queries
- Chat works even without a selected repo (use `@repo:` to reference any repository)

### Navigation & UX
- Keyboard shortcuts (press 1–5 to jump between pages)
- Page descriptions on all five pages (Commits, Branches, Compare, Stash, Tags)
- Safety-tiered confirmation dialogs for destructive operations
- Responsive design with mobile chat overlay

### File Management (GitHub Mode)
- Create or update files directly in a repository (commits to branch)
- Delete files from a repository
- Full approval flow for write operations

### Releases (GitHub Mode)
- Create GitHub releases with tag, title, and markdown release notes
- Support for draft and pre-release flags
- Target specific branches for tagging

### Repository Creation
- Create new GitHub repositories from the chat (public or private)
- Initialize with README, .gitignore template, and license

### GitHub Mode Operations
- All 11 API routes standardized with consistent error handling
- Branch deletion, cherry-pick, revert, and reset via GitHub API
- Async parallelization across 5 service functions for faster loading

## Safety

Operations are grouped into tiers:

| Tier | Examples | Safeguard |
|------|----------|-----------|
| Safe | Log, diff, status | None |
| Moderate | Cherry-pick, revert, merge, create file, create release | Confirmation dialog |
| Dangerous | Soft/mixed reset, delete branch, update/delete file | Warning + confirmation |
| Critical | Hard reset, force-delete branch, delete remote branch | Typed confirmation required |

## Getting Started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) and enter a path to any local Git repository.

### GitHub Mode Setup

1. Create a GitHub OAuth app (or use an existing one)
2. Copy `.env.example` to `.env` and fill in the values:
   - `DATABASE_URL` — Neon Postgres connection string
   - `BETTER_AUTH_SECRET` — random secret for auth
   - `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` — from your GitHub OAuth app
3. Run database migrations:
   ```bash
   pnpm db:generate
   pnpm db:migrate
   ```
4. Start the app and click "Sign in with GitHub"

### Database Scripts

| Script | Purpose |
|--------|---------|
| `pnpm db:generate` | Generate migration files from schema changes |
| `pnpm db:migrate` | Run pending migrations |
| `pnpm db:push` | Push schema directly to database (dev only) |
| `pnpm db:studio` | Open Drizzle Studio for database inspection |

## Tech

Next.js, TypeScript, Tailwind CSS, shadcn/ui, simple-git, Octokit, AI SDK, better-auth, Drizzle ORM, Neon Postgres, SWR, diff2html.
