# Implementation Plan

## Architecture

- Next.js app (App Router) with two modes: **Local** and **GitHub**
- **Local mode**: Repo path in URL params (`?path=/abs/path`), stateless, bookmarkable. API routes use `simple-git` for Git operations. Runs on localhost.
- **GitHub mode**: Authenticated via better-auth with GitHub OAuth (`repo` scope). Uses Octokit to read repositories from GitHub. Read-only (no write operations like reset, cherry-pick).
- **AI Chat**: Sliding panel assistant using Vercel AI SDK 6 with GPT-4o. Multi-step tool calling (up to 8 steps) for autonomous repo exploration. Available in local mode only.
- SWR for client-side data fetching with cache invalidation after mutations
- Drizzle ORM with Neon Postgres for auth persistence (user, session, account tables)
- Dark mode default via `next-themes`
- Unified hooks layer that delegates to local or GitHub hooks based on mode
- Fully responsive design (mobile-first, breakpoints: sm:640px, md:768px, lg:1024px)

## Pages

| Route | Purpose |
|-------|---------|
| `/` | Mode selector: enter local path or sign in with GitHub to browse remote repos |
| `/repo/commits` | Commit history with paginated table, search, filter by branch/author |
| `/repo/commits/[hash]` | Single commit detail with file diffs |
| `/repo/compare` | Compare two commits with diff viewer |
| `/repo/branches` | Branch management: list, create, switch, delete (local + remote), merge |
| `/repo/tags` | Tag management: list, create, delete, search/filter |
| `/repo/stash` | Stash management: save, apply, pop, drop, clear |

## API Endpoints

### Local Git API

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/git/repo` | GET/POST | Validate repo path, get repo info |
| `/api/git/commits` | GET | Paginated commit list with search/filter |
| `/api/git/commits/[hash]` | GET | Single commit detail |
| `/api/git/diff` | GET | Diff between two commits |
| `/api/git/reset` | POST | Reset to commit (soft/mixed/hard) |
| `/api/git/cherry-pick` | POST | Cherry-pick commit(s) |
| `/api/git/revert` | POST | Revert commit(s) |
| `/api/git/branches` | GET/POST/DELETE | Branch CRUD (local + remote delete) |
| `/api/git/branches/checkout` | POST | Switch branch |
| `/api/git/branches/merge` | POST | Merge branch |
| `/api/git/status` | GET | Working tree status |
| `/api/git/browse` | GET | Filesystem directory browsing |
| `/api/git/tags` | GET/POST/DELETE | Tag CRUD |
| `/api/git/stash` | GET/POST/DELETE | Stash operations |

### GitHub API (proxied via Octokit)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/github/repos` | GET | List authenticated user's repos |
| `/api/github/commits` | GET | Commits for a GitHub repo |
| `/api/github/commits/[hash]` | GET | Single commit detail from GitHub |
| `/api/github/branches` | GET | Branches for a GitHub repo |
| `/api/github/tags` | GET | Tags for a GitHub repo |
| `/api/github/diff` | GET | Diff between two commits on GitHub |

### AI Chat API

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/chat` | POST | Streaming chat endpoint (AI SDK `streamText` + tools) |

### Auth

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/auth/[...all]` | ALL | better-auth catch-all (login, callback, session) |

## Safety Tiers

| Level | Operations | Safeguard |
|-------|-----------|-----------|
| Safe (read-only) | log, diff, status, branch list | None |
| Moderate | cherry-pick, revert, merge, create branch/tag | Simple confirmation |
| Dangerous | soft/mixed reset, delete branch, delete tag | Confirmation dialog with warning |
| Critical | hard reset, force delete branch, delete remote branch | Typed confirmation required |

## AI Chat Feature

### Overview
A sliding panel chat assistant available on all `/repo/*` pages (local mode only). Users click a floating button to open it.

### Tech Stack
- Vercel AI SDK 6 (`ai@6.x`, `@ai-sdk/openai`, `@ai-sdk/react`)
- OpenAI GPT-4o model
- Server-side API key via `OPENAI_API_KEY` env var
- react-markdown for rendering AI responses

### Architecture
- **API Route** (`/api/chat`): POST handler using `streamText` with multi-step tool calling (up to 8 steps). Validates repo path, creates scoped git tools, streams response.
- **Tools Layer** (`src/lib/ai/tools.ts`): Factory function `createGitTools(repoPath)` returns 12 tools wrapping existing git service functions.
- **System Prompt** (`src/lib/ai/system-prompt.ts`): Dynamic prompt builder with repo context, tool descriptions, behavioral guidelines.
- **Chat UI** (`src/components/chat/`): Sheet-based sliding panel with message list, markdown rendering, tool call indicators, auto-scroll, clear history.
- **Chat Trigger** (`src/components/chat/chat-trigger.tsx`): Floating button with tooltip, placed in repo layout.

### AI Tools (12 total)

**Read-only (10 tools, auto-executed):**

| Tool | Purpose | Wraps |
|------|---------|-------|
| `getRepoOverview` | Repo metadata, branch, remotes, clean status | `git.branchLocal()`, `git.getRemotes()`, `git.log()`, `git.status()` |
| `getCommitHistory` | Search/list commits with filters | `getCommits()` |
| `getCommitDetails` | Full commit diff + file stats | `getCommitDetail()` |
| `listBranches` | All local + remote branches | `getBranches()` |
| `compareDiff` | Diff between any two refs | `getDiff()` |
| `getWorkingTreeStatus` | Staged, modified, untracked, ahead/behind | `getStatus()` |
| `listTags` | All tags with metadata | `getTags()` |
| `listStashes` | All stashed changes | `getStashList()` |
| `getFileContent` | Read file at any git ref | `git.show()` |
| `listFiles` | Browse repo file tree at any ref | `git.raw(["ls-tree"])` |

**Write (2 creation + 2 mutation tools):**

| Tool | Purpose | Wraps |
|------|---------|-------|
| `createNewBranch` | Create + checkout new branch | `createBranch()` |
| `switchBranch` | Switch to a branch | `checkoutBranch()` |
| `cherryPickCommits` | Cherry-pick commits | `cherryPickCommit()` |
| `revertCommits` | Revert commits | `revertCommit()` |

### Chat UI Features
- Streaming responses with real-time token display
- Tool call status indicators (running/complete/error) with per-tool icons
- Markdown rendering with syntax-highlighted code blocks, tables, lists
- Auto-resizing textarea with Enter to send, Shift+Enter for newline
- Stop streaming button
- Clear chat history
- Empty state with suggested queries
- "Powered by GPT-4o" badge
- Local mode guard (disabled in GitHub mode)
- Responsive design (full-width on mobile, 440px sheet on desktop)

## File Structure

```
src/
  config/
    axios.ts              # Axios instance
    api-endpoints.ts      # Local git API endpoint URLs
    github-endpoints.ts   # GitHub API endpoint URLs
    constants.ts          # Constants and enums
  services/
    frontend/
      git.services.ts     # API calls for local git operations
      github.services.ts  # API calls for GitHub operations
    server/               # (Reserved for future server-side services)
  hooks/
    use-git/
      index.ts            # SWR hooks for local git data + mutations
    use-github/
      index.ts            # SWR hooks for GitHub data
    use-unified.ts        # Unified hooks that delegate by mode
    use-mode.tsx          # ModeProvider context (local | github)
    use-repo.ts           # Repo context (path, mode, owner, repoName)
    use-recent-repos.ts   # localStorage recent repos
    use-keyboard-shortcuts.ts  # Global keyboard navigation
  schemas/
    git.ts                # Zod schemas for validation
  lib/
    ai/
      tools.ts            # AI tool definitions (12 tools wrapping git functions)
      system-prompt.ts    # Dynamic system prompt builder
    git/                  # Git backend (types, client, modules)
      index.ts            # Barrel exports
      types.ts            # TypeScript interfaces (CommitInfo, BranchInfo, etc.)
      client.ts           # SimpleGit instance factory + validation
      commits.ts          # getCommits, getCommitDetail
      branches.ts         # getBranches, createBranch, deleteBranch, checkoutBranch, mergeBranch
      diff.ts             # getDiff
      operations.ts       # resetToCommit, cherryPickCommit, revertCommit
      status.ts           # getStatus
      stash.ts            # getStashList, stashSave, stashApply, stashPop, stashDrop, stashClear
      tags.ts             # getTags, createTag, deleteTag
    github/
      client.ts           # Octokit service for GitHub API
    auth.ts               # better-auth server config
    auth-client.ts        # better-auth React client
    auth-helpers.ts       # Server-side auth helpers
    db/
      schema.ts           # Drizzle schema (user, session, account)
      index.ts            # Neon serverless + Drizzle connection
    response/
      server-response.ts  # Standardized API response helper
    formatters.ts         # Shared formatting utilities (with isValid guards)
    utils.ts              # shadcn utility (cn)
  components/
    ui/                   # shadcn components (button, badge, card, sheet, dialog, etc.)
    providers.tsx         # ThemeProvider, TooltipProvider, ModeProvider
    loaders/              # Loading skeletons (commit-list, branch-list)
    repo/                 # Repo selector, layout, header, path-input
    commits/              # Commit list, detail
    branches/             # Branch management
    tags/                 # Tag management
    stash/                # Stash management
    diff/                 # Diff viewer, compare view
    shared/               # Confirmation dialog, site-footer, mode-promo
    github/               # GitHub-specific components (repo-picker)
    chat/                 # AI Chat feature
      chat-panel.tsx      # Sliding Sheet panel with useChat hook
      chat-trigger.tsx    # Floating button to open chat
      chat-message.tsx    # Message renderer with markdown + tool indicators
      chat-input.tsx      # Auto-resizing textarea with send/stop
    icons/                # Custom icon components
  app/
    globals.css           # Tailwind v4 imports + custom theme + chat-markdown styles
    layout.tsx            # Root layout with providers
    page.tsx              # Landing page (mode selector)
    repo/
      layout.tsx          # Repo layout with nav tabs + ChatTrigger
      commits/
        page.tsx
        [hash]/page.tsx
      compare/page.tsx
      branches/page.tsx
      tags/page.tsx
      stash/page.tsx
    api/
      auth/[...all]/route.ts  # better-auth handler
      chat/route.ts            # AI chat streaming endpoint
      git/                     # Local git API route handlers
      github/                  # GitHub API route handlers
```

## Database

- **Provider**: Neon Postgres (serverless)
- **ORM**: Drizzle ORM
- **Tables**: user, session, account, verification (managed by better-auth)
- **Scripts**: `pnpm db:generate`, `pnpm db:migrate`, `pnpm db:push`, `pnpm db:studio`
- **Config**: `drizzle.config.ts` at project root

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Neon Postgres connection string |
| `BETTER_AUTH_SECRET` | Auth encryption secret |
| `GITHUB_CLIENT_ID` | GitHub OAuth app client ID |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth app secret |
| `OPENAI_API_KEY` | OpenAI API key for AI chat (GPT-4o) |

## Implementation Order

1. Scaffold project, install deps, configure shadcn/ui
2. Git backend library (`lib/git/`)
3. Server response helpers and API routes
4. Config files (axios, endpoints, constants)
5. Services and hooks
6. Layout and landing page
7. Commits UI (list, search/filter, row actions, detail page)
8. Diff UI (diff2html viewer, compare page)
9. Branches UI (list, create/delete/merge, local + remote delete)
10. Tags UI (list, create/delete)
11. Stash UI (list, save/apply/pop/drop/clear)
12. Auth + database setup (better-auth, Drizzle, Neon)
13. GitHub mode (Octokit client, GitHub API routes, services, hooks)
14. Unified hooks layer + mode switching UI
15. Polish (loading states, error handling, toasts, keyboard shortcuts)
16. **Responsive design** (mobile-first across all components)
17. **AI Chat feature** (tools, system prompt, API route, chat UI panel)

## Current Status

### Completed
- [x] Project scaffold + all dependencies installed
- [x] Git backend library with full coverage (commits, branches, diff, status, tags, stash, operations)
- [x] All local git API routes (15 endpoints)
- [x] All GitHub API routes (6 endpoints)
- [x] Auth system (better-auth + GitHub OAuth + Drizzle + Neon)
- [x] Config layer (axios, endpoints, constants)
- [x] Frontend services (git.services.ts, github.services.ts)
- [x] SWR hooks (use-git, use-github, use-unified)
- [x] Layout system (landing page, repo layout, header with nav tabs)
- [x] Commits UI (paginated list, search, detail page)
- [x] Diff UI (diff2html viewer, compare page)
- [x] Branches UI (list, create, switch, delete local/remote, merge)
- [x] Tags UI (list, create, delete)
- [x] Stash UI (list, save, apply, pop, drop, clear)
- [x] Safety tiers with confirmation dialogs
- [x] Site-wide responsive design (all components mobile-optimized)
- [x] Site footer with hydration fix
- [x] Date formatting with isValid guards
- [x] AI Chat: Tools layer (12 tools wrapping git functions)
- [x] AI Chat: System prompt builder
- [x] AI Chat: Streaming API route with multi-step tool calling
- [x] AI Chat: Chat panel UI (Sheet, messages, input, trigger)
- [x] AI Chat: Integrated into repo layout
- [x] Build passes (`pnpm build` with zero errors)

### Pending / Future
- [ ] Chat message persistence (save/restore chat history)
- [ ] GitHub mode chat support (via Octokit tools)
- [ ] Generative UI (render commit cards, diff blocks, branch badges inline in chat)
- [ ] Token usage tracking and display per message
- [ ] Write operation approval UI in chat (confirm before branch create, cherry-pick, etc.)
- [ ] Support for additional AI providers (Anthropic, Gemini)
- [ ] Chat suggested actions based on repo state

## Verification

1. `pnpm dev` starts on localhost:3000
2. Enter a local git repo path, validates and opens
3. View commit history with pagination and search
4. Reset, cherry-pick, revert operations work with proper confirmations
5. Diff view shows file changes between commits
6. Branch management (create, switch, delete local/remote, merge) works
7. Tag management (create, delete, filter) works
8. Stash management (save, apply, pop, drop, clear) works
9. Sign in with GitHub, browse remote repos read-only
10. AI chat opens via floating button, can query repo with natural language
11. AI uses tools to fetch real data (commits, branches, diffs, files)
12. All pages are responsive on mobile (320px+)
13. `pnpm build` completes without errors
