# Development Workflow Rules

## Frontend Integration Workflow

We use `src/config/axios.ts` for making API calls using an axios instance with predefined configurations like baseURL, headers, and interceptors.

1. List API endpoints in `src/config/api-endpoints.ts`.
2. Create services in `src/services/frontend/{api_name}.services.ts` to handle API calls using the listed endpoints.
3. Create hooks in `src/hooks/use-{api_name}/` to encapsulate interaction logic using the services.
4. Integrate hooks into relevant frontend components.
5. Use shadcn/ui components for consistent UI design.
6. Create components in `src/components/{feature_name}/{feature-name}.tsx`.
7. Constants and enums go in `src/config/constants.ts`.
8. Schema and form validation go in `src/schemas/{api_name}.ts` using zod.
9. Loading skeletons and loaders go in `src/components/loaders/`.
10. Use shared formatting utilities from `src/lib/formatters.ts`.

## Server Integration Workflow

1. Define routes in `src/app/api/{api_name}/route.ts`.
2. If the API needs server-side services, create them in `src/services/server/{service_name}.ts`. Business logic lives in route handlers or server services.
3. For structured responses, use `src/lib/response/server-response.ts` for consistent formatting.
4. Constants and enums go in `src/config/constants.ts`.

## AI Chat Integration Workflow

The AI Chat feature uses Vercel AI SDK 6 with a tool-calling architecture.

### Backend (API Route)

- Route: `src/app/api/chat/route.ts`
- Uses `streamText` from `ai` package with OpenAI GPT-4o model.
- Multi-step tool calling with `stopWhen: stepCountIs(8)`.
- Tools are created per-request via `createGitTools(repoPath)` from `src/lib/ai/tools.ts`.
- System prompt is built dynamically via `buildSystemPrompt(repoPath)` from `src/lib/ai/system-prompt.ts`.
- The route validates `isLocalModeAllowed()` and checks for `OPENAI_API_KEY`.
- Messages are converted with `convertToModelMessages(messages)` from `ai`.
- Response streamed via `result.toUIMessageStreamResponse()`.

### Tools Layer

- Factory pattern: `createGitTools(repoPath)` returns all 12 tools scoped to that repo path.
- Each tool uses `tool()` from `ai` with zod schemas for parameter validation.
- Tools wrap existing git service functions from `src/lib/git/` (no duplication).
- Read-only tools: `getRepoOverview`, `getCommitHistory`, `getCommitDetails`, `listBranches`, `compareDiff`, `getWorkingTreeStatus`, `listTags`, `listStashes`, `getFileContent`, `listFiles`.
- Write tools: `createNewBranch`, `switchBranch`, `cherryPickCommits`, `revertCommits`.
- Large outputs are truncated (diffs to 8000 chars, file content to 6000 chars).

### Frontend (Chat UI)

- `src/components/chat/chat-panel.tsx`: Main panel using `useChat` from `@ai-sdk/react` with `DefaultChatTransport`.
- `src/components/chat/chat-trigger.tsx`: Floating button placed in `src/app/repo/layout.tsx`.
- `src/components/chat/chat-message.tsx`: Renders messages with `react-markdown`, shows tool call status with icons.
- `src/components/chat/chat-input.tsx`: Auto-resizing textarea with send/stop buttons.
- Chat panel is a Sheet (radix-ui) sliding from the right, `sm:max-w-[440px]`.

### Adding New AI Tools

1. Add the tool definition in `src/lib/ai/tools.ts` inside the `createGitTools` function.
2. Use `tool()` from `ai` with a zod schema for parameters and an `execute` function.
3. Add the tool name to `TOOL_LABELS` and `TOOL_ICONS` maps in `chat-message.tsx`.
4. Update the system prompt in `src/lib/ai/system-prompt.ts` if the tool needs special instructions.
5. No changes needed to the API route (tools are auto-discovered from the tools object).

## Mention/Reference System

The chat supports an `@` mention system that lets users reference repo entities (files, commits, branches, tags, stashes, repos) in chat messages.

### Trigger Mechanism

- Typing `@` in the chat input (at start or after whitespace) opens a categorized picker
- Clicking the `@` button in the toolbar also opens the picker
- Users can select multiple items across categories; selected items appear as chips above the input

### Categories and Data Sources

| Category | Local Mode | GitHub Mode |
|----------|-----------|-------------|
| File | `git ls-tree` via `/api/git/files` | `octokit.git.getTree` via `/api/github/files` |
| Commit | `gitService.getCommits` | `githubService.getGitHubCommits` |
| Branch | `gitService.getBranches` | `githubService.getGitHubBranches` |
| Tag | `gitService.getTags` | `githubService.getGitHubTags` |
| Stash | `gitService.getStashList` | Hidden in GitHub mode |
| Repository | `useRecentRepos` (localStorage) | `githubService.getGitHubRepos` |

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
| Context resolution | `src/lib/mentions/resolve-context.ts` |
| Frontend services | `src/services/frontend/mention.services.ts` |
| Candidates hook | `src/hooks/use-mention-candidates/index.ts` |
| State hook | `src/hooks/use-mentions/index.ts` |
| Picker UI | `src/components/chat/mention-picker.tsx` |
| Chips UI | `src/components/chat/mention-chips.tsx` |
| Local file API | `src/app/api/git/files/route.ts`, `src/app/api/git/files/content/route.ts` |
| GitHub file API | `src/app/api/github/files/route.ts`, `src/app/api/github/files/content/route.ts` |

### Adding a New Mention Category

1. Add the category to `MentionCategory` type in `src/lib/mentions/types.ts`
2. Add entry to `MENTION_CATEGORIES` in `src/config/constants.ts`
3. Add fetcher function in `src/hooks/use-mention-candidates/index.ts`
4. Add resolver in `src/lib/mentions/resolve-context.ts`
5. Add icon mapping in `mention-chips.tsx` and `mention-picker.tsx`

## Code Standards

- Follow Vercel React best practices for data fetching and component patterns.
- Keep documentation clear and direct. No em dashes, minimal emojis.
- Use SWR for client-side data fetching with cache invalidation after mutations.
- Use axios for HTTP requests via the configured instance.
- Tailwind CSS v4: Use utility values (e.g., `min-w-35`) not arbitrary values (e.g., `min-w-[140px]`).
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
| simple-git | 3.x | Local git operations |
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
