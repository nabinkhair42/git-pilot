# Development Workflow Rules

## Frontend Integration Workflow

We use `src/config/axios.ts` for making API calls using an axios instance with predefined configurations like baseURL, headers, and interceptors.

1. List API endpoints in `src/config/github-endpoints.ts`.
2. Create services in `src/services/frontend/{api_name}.services.ts` to handle API calls using the listed endpoints.
3. Create hooks in `src/hooks/use-{api_name}/` to encapsulate interaction logic using the services.
4. Integrate hooks into relevant frontend components.
5. Use shadcn/ui components for consistent UI design.
6. Create components in `src/components/{feature_name}/{feature-name}.tsx`.
7. Constants and enums go in `src/config/constants.ts`.
8. Loading skeletons and loaders go in `src/components/loaders/`.
9. Use shared formatting utilities from `src/lib/formatters.ts`.

## Server Integration Workflow

1. Define routes in `src/app/api/github/{api_name}/route.ts`.
2. Server-side GitHub operations live in `src/lib/github/client.ts`.
3. For structured responses, use `src/lib/response/server-response.ts` (`successResponse`, `errorResponse`).
4. Constants and enums go in `src/config/constants.ts`.

## AI Chat Integration Workflow

The AI Chat feature uses Vercel AI SDK 6 with a tool-calling architecture.

### Backend (API Route)

- Route: `src/app/api/chat/route.ts`
- Uses `streamText` from `ai` package with configurable model providers.
- Multi-step tool calling with `stopWhen: stepCountIs(8)`.
- All tools are created per-request via `createAllTools(token, owner?, repo?)` from `src/lib/ai/github-tools.ts`.
- System prompt is built dynamically via `buildSystemPrompt(owner?, repo?)` from `src/lib/ai/system-prompt.ts`.
- Both general and repo-scoped tools are available in every request.
- GitHub token fetched via `getGitHubToken()` from `src/lib/auth/auth-helpers.ts`.
- Messages are converted with `convertToModelMessages(messages)` from `ai`.
- Response streamed via `result.toUIMessageStreamResponse()`.
- Error branches use `errorResponse()` from `src/lib/response/server-response.ts`.

### Tools Layer

- Unified factory: `createAllTools(token, initialOwner?, initialRepo?)` returns all tools (general + repo-scoped) in a single object.
- Uses a **mutable context object** (`ctx = { owner, repo }`) inside the closure. `selectRepository` and `createRepository` update `ctx` mid-chain, so repo-scoped tools become functional within the same multi-step stream.
- Repo-scoped tools use a `requireRepo(toolName)` guard that returns an error if `ctx` is empty.
- Each tool uses `tool()` from `ai` with zod schemas for parameter validation.
- Tools wrap existing GitHub client functions from `src/lib/github/client.ts`.
- General tools (always functional): `listUserRepos`, `selectRepository`, `getUserProfile`, `createRepository` (needs approval), `deleteRepository` (needs approval).
- Read-only repo tools: `getRepoOverview`, `getCommitHistory`, `getCommitDetails`, `listBranches`, `compareDiff`, `listTags`, `getFileContent`, `listFiles`, `listContributors`, `listPullRequests`, `getPullRequestDetail`.
- Write repo tools (need approval): `createBranch`, `deleteBranch`, `mergeBranch`, `cherryPickCommits`, `revertCommits`, `resetBranch`, `createOrUpdateFile`, `deleteFile`, `createRelease`, `createPullRequest`, `mergePullRequest`.
- Large outputs are truncated (diffs to 8000 chars, file content to 6000 chars).

### Frontend (Chat UI)

- `src/components/chat/chat-sidebar.tsx`: Main sidebar using `useChat` from `@ai-sdk/react` with `DefaultChatTransport`. Always-visible on desktop, slide-in overlay on mobile. Chat is available even without a selected repo.
- `src/components/chat/chat-input.tsx`: Controlled textarea via `PromptInputProvider`. Inline `@` mention parsing with `useMentionQuery` hook. Keyboard forwarding for picker navigation. Model selector dropdown.
- `src/components/chat/chat-message.tsx`: Renders messages with `react-markdown`, shows tool call status with icons.
- `src/components/chat/mention-picker.tsx`: Inline dropdown with two modes: category buttons (bare `@`) and search results (with category prefix or cross-category). Single-click select.
- `src/components/chat/mention-chips.tsx`: Displays selected mentions as removable badge chips above the textarea.

### Adding New AI Tools

1. Add the GitHub client function in `src/lib/github/client.ts`.
2. Add the tool definition in `src/lib/ai/github-tools.ts` inside `createAllTools()`:
   - General tools: add alongside `listUserRepos`, `selectRepository`, etc.
   - Repo-scoped tools: use `ctx.owner`/`ctx.repo` for the owner and repo, and add a `requireRepo` guard at the top of the `execute` function.
   - Use `tool()` from `ai` with a zod schema for parameters and an `execute` function.
   - For write operations, set `needsApproval: true`.
3. Add the tool name to `TOOL_LABELS` map in `chat-message.tsx`.
4. Register a renderer in `src/components/chat/tool-renderers/registry.tsx` (use `WriteResultRenderer` for tools returning `{ success, message }`).
5. For tools with `needsApproval`, add label and description in `src/components/chat/tool-renderers/approval-renderer.tsx`.
6. Update the system prompt in `src/lib/ai/system-prompt.ts` with tool description and examples.
7. No changes needed to the API route (tools are auto-discovered from the tools object).

## Mention/Reference System

The chat supports an inline `@` mention system that lets users reference repo entities in chat messages. Typing `@` in the textarea triggers the picker inline -- no modal.

### Inline Trigger

- Typing `@` (at start or after whitespace) opens a category picker inline below the cursor
- Continuing to type (e.g., `@file:pack`) auto-switches to the matching category and filters results
- Bare `@pack` (no category prefix) searches across all categories
- Clicking the `@` toolbar button inserts `@` at the cursor position
- Single-click on an item selects it, adds a chip above the textarea, removes the `@...` text, and closes the picker

### Category Shortcuts

| Shortcut | Category |
|----------|----------|
| `@file:` | File |
| `@commit:` | Commit |
| `@branch:` | Branch |
| `@tag:` | Tag |
| `@repo:` | Repository |

### Categories and Data Sources

| Category | Data Source |
|----------|-----------|
| File | `octokit.git.getTree` via `/api/github/files` |
| Commit | `githubService.getGitHubCommits` |
| Branch | `githubService.getGitHubBranches` |
| Tag | `githubService.getGitHubTags` |
| Repository | `githubService.getGitHubRepos` |

### Cross-Category Search

When the user types `@pack` (no category prefix), the system fetches the top 10 results from each category in parallel via `Promise.allSettled` and displays them grouped by category.

### Context Resolution

On send, `resolveAllMentions()` fetches full context for each mention:
- **Files**: Content fetched and truncated to 6000 chars
- **Commits**: Detail fetched including diff (truncated to 4000 chars)
- **Others**: Lightweight labels (branch name, tag name, etc.)

The resolved context is appended to the user message as a `## User-Referenced Context` markdown section.

### File Paths

| Purpose | Path |
|---------|------|
| Types | `src/lib/mentions/types.ts` |
| Constants | `src/config/constants.ts` (MENTION_* exports) |
| Query parser hook | `src/hooks/use-mention-query/index.ts` |
| Context resolution | `src/lib/mentions/resolve-context.ts` |
| Frontend services | `src/services/frontend/mention.services.ts` |
| Candidates hook | `src/hooks/use-mention-candidates/index.ts` |
| State hook | `src/hooks/use-mentions/index.ts` |
| Picker UI | `src/components/chat/mention-picker.tsx` |
| Chips UI | `src/components/chat/mention-chips.tsx` |
| GitHub file API | `src/app/api/github/files/route.ts`, `src/app/api/github/files/content/route.ts` |

### Adding a New Mention Category

1. Add the category to `MentionCategory` type in `src/lib/mentions/types.ts`
2. Add entry to `MENTION_CATEGORIES` in `src/config/constants.ts`
3. Add shortcut to `MENTION_CATEGORY_SHORTCUTS` in `src/config/constants.ts`
4. Add fetcher function in `src/hooks/use-mention-candidates/index.ts`
5. Add resolver in `src/lib/mentions/resolve-context.ts`
6. Add icon mapping in `mention-chips.tsx` and `mention-picker.tsx`

## Code Standards

- Follow Vercel React best practices for data fetching and component patterns.
- Use `next/dynamic` for heavy components (diff viewers, markdown renderers) to reduce bundle size.
- Use ternary `{condition ? <X /> : null}` instead of `{condition && <X />}` for conditional rendering.
- Keep documentation clear and direct. No em dashes, minimal emojis.
- Use SWR for client-side data fetching with cache invalidation after mutations.
- Use axios for HTTP requests via the configured instance.
- Tailwind CSS v4: Use utility values (e.g., `min-w-35`, `text-2xs`) not arbitrary values (e.g., `min-w-[140px]`, `text-[11px]`).
- All date formatting must use `isValid()` guard from date-fns before formatting.
- Responsive design: mobile-first, test at 320px+ breakpoints.
- AI SDK 6 patterns: use `UIMessage`, `convertToModelMessages`, `DefaultChatTransport`, parts-based rendering.

## Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| next | 16.x | App Router framework |
| react | 19.x | UI library |
| ai | 6.x | Vercel AI SDK core (streamText, tool, etc.) |
| @ai-sdk/openai | 3.x | OpenAI provider for AI SDK |
| @ai-sdk/react | 3.x | React hooks for AI (useChat) |
| react-markdown | 10.x | Markdown rendering in chat |
| octokit | latest | GitHub API client |
| better-auth | latest | Auth (GitHub OAuth) |
| drizzle-orm | latest | Database ORM |
| @neondatabase/serverless | latest | Neon Postgres driver |
| swr | latest | Client-side data fetching |
| axios | latest | HTTP client |
| zod | latest | Schema validation |
| shadcn/ui | latest | UI component library (radix-ui primitives) |
| sonner | latest | Toast notifications |
| date-fns | latest | Date formatting |
| diff2html | latest | Diff rendering (dynamically imported) |
