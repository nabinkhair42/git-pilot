# Git Commit Manager

A web-based GUI for managing Git repositories. Works in two modes:

- **Local mode** -- point it at any repo on your machine and get a clean, dark-mode interface for browsing history, managing branches, comparing diffs, and performing operations without memorizing CLI flags and commit hashes.
- **GitHub mode** -- sign in with GitHub and browse your remote repositories read-only. View commits, branches, tags, and diffs.

## Why

Git is powerful but unforgiving from the command line. A wrong `git reset --hard` loses work. Cherry-picking requires copy-pasting hashes. Comparing arbitrary commits means juggling flags. This tool wraps all of that in a visual interface with built-in safety nets.

## What You Can Do

- **Browse commit history** with search, branch filtering, and pagination
- **View detailed diffs** for any commit, or compare any two commits side-by-side (unified or split view)
- **Reset, cherry-pick, and revert** commits with safety-tiered confirmation dialogs (destructive operations require typed confirmation)
- **Manage branches** -- create, switch, delete (local and remote), force-delete, and merge
- **Manage tags** -- create lightweight or annotated tags, search/filter, delete
- **Stash changes** -- save, apply, pop, drop, or clear stashes from the UI
- **Copy commit hashes** with a single click
- **Navigate with keyboard shortcuts** -- press 1-5 to jump between pages
- **Browse GitHub repos** -- sign in with GitHub OAuth to view remote repositories read-only
- **Reference repo entities in chat** -- type `@` to reference files, commits, branches, tags, and stashes for AI-enriched context

## How It Works

**Local mode**: Enter a repo path (with filesystem autocomplete), and it connects using `simple-git`. No database needed for local mode. All state comes from Git. Recent repos are remembered in localStorage. Each repo is identified by its path in the URL, so you can have multiple repos open in different tabs.

**GitHub mode**: Sign in with GitHub OAuth. Your session is stored in Neon Postgres via better-auth. Browse your repositories, view commits, branches, tags, and diffs. Write operations are hidden in GitHub mode.

## Safety

Operations are grouped into tiers:

| Tier | Examples | Safeguard |
|------|----------|-----------|
| Safe | Log, diff, status | None |
| Moderate | Cherry-pick, revert, merge | Confirmation dialog |
| Dangerous | Soft/mixed reset, delete branch | Warning + confirmation |
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
   - `DATABASE_URL` -- Neon Postgres connection string
   - `BETTER_AUTH_SECRET` -- random secret for auth
   - `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET` -- from your GitHub OAuth app
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

Next.js, TypeScript, Tailwind CSS, shadcn/ui, simple-git, Octokit, better-auth, Drizzle ORM, Neon Postgres, SWR, diff2html.
