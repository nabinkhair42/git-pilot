# Implementation Plan

## Architecture

- Next.js app (App Router) with two modes: **Local** and **GitHub**
- **Local mode**: Repo path in URL params (`?path=/abs/path`), stateless, bookmarkable. API routes use `simple-git` for Git operations. Runs on localhost.
- **GitHub mode**: Authenticated via better-auth with GitHub OAuth (`repo`, `delete_repo` scopes). Uses Octokit for full read/write operations (commits, branches, tags, diffs, cherry-pick, revert, reset, branch deletion). All 11 GitHub API routes use standardized `server-response.ts` helpers with async parallelization.
- **AI Chat**: Sidebar assistant using Vercel AI SDK 6. Multi-step tool calling (up to 8 steps). Available on all pages, including without a repo selected. Inline `@` mention system for referencing repo entities.
- SWR for client-side data fetching with cache invalidation after mutations
- Drizzle ORM with Neon Postgres for auth persistence (user, session, account tables)
- Dark mode default via `next-themes`
- Unified hooks layer that delegates to local or GitHub hooks based on mode
- Fully responsive design (mobile-first, breakpoints: sm:640px, md:768px, lg:1024px)

## Pages

| Route | Purpose |
|-------|---------|
| `/` | Mode selector: enter local path or sign in with GitHub. Chat sidebar available. |
| `/repo/commits` | Commit history with paginated table, search, filter by branch/author |
| `/repo/commits/[hash]` | Single commit detail with file diffs |
| `/repo/compare` | Compare two commits with diff viewer (unified/split toggle) |
| `/repo/branches` | Branch management: list, create, switch, delete (local + remote), merge |
| `/repo/tags` | Tag management: list, create, delete, search/filter |
| `/repo/stash` | Stash management: save, apply, pop, drop, clear |

All five repo pages include page descriptions.

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
| `/api/git/files` | GET | List files in repo |
| `/api/git/files/content` | GET | Get file content |

### GitHub API (proxied via Octokit)

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/github/repos` | GET | List authenticated user's repos |
| `/api/github/commits` | GET | Commits for a GitHub repo |
| `/api/github/commits/[hash]` | GET | Single commit detail from GitHub |
| `/api/github/branches` | GET/DELETE | Branches (list + delete) |
| `/api/github/tags` | GET | Tags for a GitHub repo |
| `/api/github/diff` | GET | Diff between two commits on GitHub |
| `/api/github/files` | GET | List files in repo tree |
| `/api/github/files/content` | GET | Get file content |
| `/api/github/cherry-pick` | POST | Cherry-pick commits via GitHub API |
| `/api/github/revert` | POST | Revert commits via GitHub API |
| `/api/github/reset` | POST | Reset branch to commit via GitHub API |

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
A sidebar chat assistant available on all pages, including the home page without a repo selected. Users can reference repo entities via inline `@` mentions.

### Tech Stack
- Vercel AI SDK 6 (`ai@6.x`, `@ai-sdk/openai`, `@ai-sdk/react`)
- OpenAI GPT-4o model
- Server-side API key via `OPENAI_API_KEY` env var
- react-markdown for rendering AI responses

### Architecture
- **API Route** (`/api/chat`): POST handler using `streamText` with multi-step tool calling (up to 8 steps). Validates repo path, creates scoped git tools, streams response.
- **Tools Layer** (`src/lib/ai/github-tools.ts`): Factory functions `createGitHubTools(owner, repo, token)` (repo-scoped) and `createGeneralTools(token)` (no repo needed) return tools wrapping GitHub client functions.
- **System Prompt** (`src/lib/ai/system-prompt.ts`): Dynamic prompt builder with repo context, tool descriptions, behavioral guidelines.
- **Chat Sidebar** (`src/components/chat/chat-sidebar.tsx`): Fixed sidebar on desktop, slide-in overlay on mobile. Always shows input, even without a repo.
- **Chat Input** (`src/components/chat/chat-input.tsx`): Controlled textarea with inline `@` mention parsing, keyboard forwarding, model selector.
- **Mention Picker** (`src/components/chat/mention-picker.tsx`): Inline dropdown with category buttons and search results.

### AI Tools

**Read-only tools (auto-executed):**

| Tool | Purpose | Wraps |
|------|---------|-------|
| `getRepoOverview` | Repo metadata, branch, remotes, clean status | `getRepoInfo()`, `getStatus()` |
| `getCommitHistory` | Search/list commits with filters | `getCommits()` |
| `getCommitDetails` | Full commit diff + file stats | `getCommitDetail()` |
| `listBranches` | All branches with default indicator | `getBranches()` |
| `compareDiff` | Diff between any two refs | `getCompare()` |
| `listTags` | All tags with metadata | `getTags()` |
| `getFileContent` | Read file at any git ref | `getFileContent()` |
| `listFiles` | Browse repo file tree at any ref | `getFileTree()` |
| `listContributors` | Repo contributors with avatars and stats | `getContributors()` |
| `getUserProfile` | Public GitHub profile for any user | `getUserProfile()` |
| `listPullRequests` | List pull requests filtered by state | `listPullRequests()` |
| `getPullRequestDetail` | Full PR details including reviews, files, merge status | `getPullRequestDetail()` |

**Write tools (repo-scoped, need approval):**

| Tool | Purpose | Wraps |
|------|---------|-------|
| `createBranch` | Create new branch from any ref | `createBranch()` |
| `deleteBranch` | Delete a branch (irreversible) | `deleteBranch()` |
| `mergeBranch` | Merge one branch into another | `mergeBranch()` |
| `cherryPickCommits` | Cherry-pick a commit onto a branch | `cherryPickCommit()` |
| `revertCommits` | Revert a commit on a branch | `revertCommit()` |
| `resetBranch` | Force-reset branch to SHA (destructive) | `resetBranch()` |
| `createOrUpdateFile` | Create or update a file (commits to branch) | `createOrUpdateFile()` |
| `deleteFile` | Delete a file (irreversible) | `deleteFile()` |
| `createRelease` | Create release with tag and notes | `createRelease()` |
| `deleteRepository` | Permanently delete a GitHub repository (irreversible) | `deleteRepository()` |
| `createPullRequest` | Create a new pull request | `createPullRequest()` |
| `mergePullRequest` | Merge a pull request (merge/squash/rebase) | `mergePullRequest()` |

**General tools (no repo required):**

| Tool | Purpose | Wraps |
|------|---------|-------|
| `listUserRepos` | List user's GitHub repos | `getUserRepos()` |
| `selectRepository` | Select a repo to unlock full tools | `getRepoInfo()` |
| `getUserProfile` | Public GitHub profile for any user | `getUserProfile()` |
| `createRepository` | Create new GitHub repo (needs approval) | `createRepository()` |
| `deleteRepository` | Permanently delete a GitHub repo (needs approval) | `deleteRepository()` |

### Inline Mention System

- Type `@` to open category picker (File, Commit, Branch, Tag, Stash, Repo)
- Type `@file:pack` to search files matching "pack"
- Type `@pack` for cross-category search
- Single-click selects item, adds chip above textarea, removes `@...` text
- Category shortcuts: `@file:`, `@commit:`, `@branch:`, `@tag:`, `@stash:`, `@repo:`
- Stash hidden in GitHub mode

## File Structure

```
src/
  config/
    axios.ts              # Axios instance
    api-endpoints.ts      # Local git API endpoint URLs
    github-endpoints.ts   # GitHub API endpoint URLs
    constants.ts          # Constants, enums, MENTION_CATEGORIES, MENTION_CATEGORY_SHORTCUTS
  services/
    frontend/
      git.services.ts     # API calls for local git operations
      github.services.ts  # API calls for GitHub operations
      mention.services.ts # API calls for mention file listing/content
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
    use-mention-query/
      index.ts            # Inline mention query parser (textarea text + cursor)
    use-mention-candidates/
      index.ts            # SWR fetcher for mention items (single + cross-category)
    use-mentions/
      index.ts            # Selected mentions state (add, remove, clear)
  schemas/
    git.ts                # Zod schemas for validation
  lib/
    ai/
      github-tools.ts     # AI tool definitions (repo-scoped + general tools wrapping GitHub client)
      system-prompt.ts    # Dynamic system prompt builder (general + GitHub modes)
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
    mentions/
      types.ts            # MentionItem, MentionCategory, ResolvedMentionContext
      resolve-context.ts  # Fetch full context for mentions on send
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
    ui/                   # shadcn components (button, badge, card, dialog, etc.)
    ai-elements/          # PromptInput, ModelSelector components
    providers.tsx         # ThemeProvider, TooltipProvider, ModeProvider
    loaders/              # Loading skeletons (commit-list, branch-list)
    repo/                 # Repo selector, layout, header, path-input
    commits/              # Commit list, detail, list-item
    branches/             # Branch management
    tags/                 # Tag management, list-item
    stash/                # Stash management, list-item
    diff/                 # Diff viewer, compare view
    shared/               # Confirmation dialog, site-footer, mode-promo, mode-switcher
    github/               # GitHub-specific components (repo-picker)
    chat/                 # AI Chat feature
      chat-sidebar.tsx    # Main container (desktop sidebar + mobile overlay)
      chat-input.tsx      # Controlled textarea + inline mentions + model selector
      chat-message.tsx    # Message renderer with markdown + tool indicators
      mention-picker.tsx  # Inline dropdown (categories + search)
      mention-chips.tsx   # Selected mention badges
    icons/                # Custom icon components
  app/
    globals.css           # Tailwind v4 imports + custom theme + chat-markdown styles
    layout.tsx            # Root layout with providers
    page.tsx              # Landing page (mode selector + chat sidebar)
    repo/
      layout.tsx          # Repo layout with nav tabs + chat sidebar
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
      github/                  # GitHub API route handlers (11 routes)
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

## Current Status

### Completed
- [x] Project scaffold + all dependencies installed
- [x] Git backend library with full coverage (commits, branches, diff, status, tags, stash, operations)
- [x] All local git API routes (16 endpoints)
- [x] All GitHub API routes (11 endpoints) with standardized server-response helpers
- [x] Auth system (better-auth + GitHub OAuth + Drizzle + Neon)
- [x] Config layer (axios, endpoints, constants)
- [x] Frontend services (git.services.ts, github.services.ts, mention.services.ts)
- [x] SWR hooks (use-git, use-github, use-unified)
- [x] Layout system (landing page, repo layout, header with nav tabs)
- [x] Commits UI (paginated list, search, detail page)
- [x] Diff UI (diff2html viewer, compare page, unified/split toggle with icons)
- [x] Branches UI (list, create, switch, delete local/remote, merge)
- [x] Tags UI (list, create, delete)
- [x] Stash UI (list, save, apply, pop, drop, clear)
- [x] Safety tiers with confirmation dialogs
- [x] Site-wide responsive design (all components mobile-optimized)
- [x] Page descriptions on all 5 repo pages
- [x] Date formatting with isValid guards
- [x] Keyboard shortcuts (1-5 for page navigation)
- [x] AI Chat: Tools layer (12 tools wrapping git functions)
- [x] AI Chat: System prompt builder (local + GitHub)
- [x] AI Chat: Streaming API route with multi-step tool calling
- [x] AI Chat: Sidebar UI (desktop + mobile)
- [x] AI Chat: Chat available without repo selected
- [x] AI Chat: Inline `@` mention system with category shortcuts
- [x] AI Chat: Cross-category search for bare `@` queries
- [x] AI Chat: Mention chips above textarea
- [x] GitHub mode: Branch deletion
- [x] GitHub mode: Cherry-pick commits
- [x] GitHub mode: Revert commits
- [x] GitHub mode: Reset branch to commit
- [x] GitHub mode: Async parallelization (5 functions optimized with Promise.all)
- [x] GitHub mode: All API routes standardized with server-response.ts
- [x] Commit selector truncation (truncateMiddle for long messages)
- [x] Button asChild fix (React.Children.only crash)
- [x] Diff line number overflow fix (CSS table-layout, min-width, padding)
- [x] Build passes (`pnpm build` with zero errors)
- [x] GitHub mode: Create/update/delete files via chat with approval flow
- [x] GitHub mode: Create releases via chat with approval flow
- [x] GitHub mode: Create repositories via chat with approval flow
- [x] Rich tool output renderers (per-tool custom UI in chat)
- [x] Write operation approval UI in chat (confirm/deny for destructive operations)
- [x] Contributors and user profile tools
- [x] GitHub mode: Delete repositories via chat with approval flow
- [x] GitHub mode: Merge branches via chat with approval flow
- [x] GitHub mode: Pull request management (list, view details, create, merge) via chat with approval flow

### Pending / Future
- [ ] Chat message persistence (save/restore chat history)
- [ ] Generative UI (render commit cards, diff blocks, branch badges inline in chat)
- [ ] Token usage tracking and display per message
- [ ] Support for additional AI providers (Anthropic, Gemini)
- [ ] Chat suggested actions based on repo state

## Verification

1. `pnpm dev` starts on localhost:3000
2. Enter a local git repo path, validates and opens
3. View commit history with pagination and search
4. Reset, cherry-pick, revert operations work with proper confirmations
5. Diff view shows file changes between commits (unified + split toggle)
6. Branch management (create, switch, delete local/remote, merge) works
7. Tag management (create, delete, filter) works
8. Stash management (save, apply, pop, drop, clear) works
9. Sign in with GitHub, browse and manage remote repos
10. GitHub mode: branch deletion, cherry-pick, revert, reset work
11. AI chat opens in sidebar, can query repo with natural language
12. AI uses tools to fetch real data (commits, branches, diffs, files)
13. Type `@file:` in chat to search files, select to add chip
14. Type `@pack` for cross-category search
15. Chat works on home page without repo selected
16. All pages are responsive on mobile (320px+)
17. Without a repo: ask "Create a new private repo called test-repo" shows approval dialog then creates repo
18. With a repo: ask "Add a README.md file" shows approval dialog then creates file
19. With a repo: ask "Delete the old config file" shows approval dialog then deletes file
20. With a repo: ask "Create a release v1.0.0" shows approval dialog then creates release
21. With or without a repo: ask "Delete my old test-repo" shows approval dialog with permanent deletion warning then deletes repo
22. `pnpm build` completes without errors
23. "List open PRs" shows pull request list with state badges, clickable items
24. Click a PR shows detail view with reviews, files, description, action buttons
25. "Create a PR from feature/x to main" shows approval dialog then creates PR
26. "Merge PR #42 using squash" shows approval dialog then merges PR
