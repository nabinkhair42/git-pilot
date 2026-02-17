# Chat Implementation Summary

## Overview
AI-powered chat sidebar with inline `@` mention system. Uses Vercel AI SDK 6 with tool-calling architecture. Available on all pages, including without a selected repo.

## Architecture

### Layout Structure
```
+--------------------------------------------+
|         Header (fixed)                     |
+-------------------------+------------------+
|   Main Content          |  Chat Sidebar    |
|   (scrollable)          |  (fixed)         |
|   - Repo pages          |  - Top bar       |
|   - Footer              |  - Messages      |
|                         |  - Input (bottom) |
+-------------------------+------------------+
```

**Key characteristics:**
- **Desktop**: Fixed sidebar layout, only main content scrolls
- **Mobile**: Chat slides in as overlay with backdrop
- **Main content never shifts** -- chat is part of the layout, not an overlay
- **Chat always available** -- works without a repo selected (use `@repo:` to reference repos)

## Components

### 1. `chat-sidebar.tsx` (Main Container)
**Desktop behavior:**
- Always visible as fixed sidebar
- Full height from header to bottom
- Only messages inside scroll

**Mobile behavior:**
- Hidden by default
- Floating trigger button (bottom-right)
- Slides in as full-screen overlay

**AI SDK Integration:**
```tsx
const { messages, sendMessage, status, stop, setMessages } = useChat({
  id: "repo-chat",
  transport,
});
```

**No-repo state:**
- Chat input always rendered (not gated on repo selection)
- Empty state shown only when no messages AND no repo selected
- Hints user to use `@repo:` to reference repositories

### 2. `chat-input.tsx` (Input Component)
**Architecture:**
- Wrapped in `PromptInputProvider` for controlled textarea access
- Inner component uses `usePromptInputController()` to read/write textarea value
- `useMentionQuery()` hook parses text + cursor position for inline mentions
- `useMentions()` hook manages selected mention chips

**Inline Mention Flow:**
1. User types `@` -- `parseMentionQuery` detects it, picker opens showing category buttons
2. User clicks "File" -- text becomes `@file:`, picker switches to file search mode
3. User types `pack` -- text is `@file:pack`, picker filters files containing "pack"
4. User selects item -- `@file:pack` removed from text, chip added above textarea, picker closes
5. Alternative: user types `@pack` (no category) -- cross-category search across all categories

**Keyboard Handling:**
- `Escape`: Close picker, keep typed text
- `Enter` (picker open): Prevent form submit, let cmdk handle item selection
- `Enter` (picker closed): Submit message normally

**`@` Toolbar Button:**
- Inserts `@` at current cursor position
- Triggers mention query parsing
- Opens picker

### 3. `mention-picker.tsx` (Inline Dropdown)
**Two display modes:**

1. **Categories mode** (`query.mode === "categories"`): Grid of category buttons (File, Commit, Branch, Tag, Stash, Repo). Stash hidden in GitHub mode. Clicking inserts the shortcut (e.g., `@file:`) into textarea.

2. **Search mode** (`query.mode === "search"`): `CommandList` of items from `useMentionCandidates`. When category is null, results grouped by category headers. Single-click selects.

**Key differences from previous picker:**
- No `CommandInput` (search comes from textarea)
- No checkboxes (single-click select)
- No footer (no Add/Cancel buttons)
- No tabs (category from typed prefix)
- Click-outside closes picker

### 4. `mention-chips.tsx` (Selected Mentions)
- Displays selected mentions as badge chips above the textarea
- Category icon + truncated label (30 chars max)
- X button to remove individual mentions
- Returns null if no mentions

### 5. `chat-message.tsx` (Message Display)
**Rendering:**
- Uses `message.parts` (not `content`)
- Supports text, tool calls, reasoning parts
- Auto-scrolls to bottom on new messages

**Features:**
- User/AI avatars with role-based styling
- Tool call indicators with icons and labels via `TOOL_LABELS` map
- Tool states: running, complete, error, approval-requested, output-denied
- Rich tool output renderers via `toolRenderers` registry (per-tool custom UI)
- Approval UI for write operations (`ApprovalRenderer` with confirm/deny buttons)
- Markdown rendering (ReactMarkdown)
- Code syntax highlighting
- "Thinking..." indicator when `status === "submitted"`
- Empty state with suggested questions

### 6. `tool-renderers/` (Tool Output Renderers)
**Registry** (`registry.tsx`): Maps tool names to renderer components.

**Available renderers:**
- `RepoOverviewRenderer` - repo metadata display
- `CommitHistoryRenderer` - commit list with hashes and dates
- `CommitDetailRenderer` - full commit diff view
- `BranchListRenderer` - branch list with current indicator
- `TagListRenderer` - tag list
- `CompareDiffRenderer` - diff between two refs
- `FileListRenderer` - directory listing
- `FileContentRenderer` - file content viewer
- `WriteResultRenderer` - success/failure for write operations (used by `createBranch`, `deleteBranch`, `mergeBranch`, `cherryPickCommits`, `revertCommits`, `resetBranch`, `createRepository`, `createOrUpdateFile`, `deleteFile`, `createRelease`, `createPullRequest`, `mergePullRequest`)
- `ContributorListRenderer` - contributor avatars and stats
- `UserProfileRenderer` - GitHub user profile card
- `PRListRenderer` - pull request list with state badges
- `PRDetailRenderer` - full PR detail with reviews, files, actions

**Approval renderer** (`approval-renderer.tsx`): Shows warning banner with description and approve/deny buttons for write operations. Covers: `deleteBranch`, `mergeBranch`, `cherryPickCommits`, `revertCommits`, `resetBranch`, `createRepository`, `createOrUpdateFile`, `deleteFile`, `createRelease`, `createPullRequest`, `mergePullRequest`.

## Hooks

### `useMentionQuery`
Parses textarea text + cursor position to extract active mention query.

```typescript
interface MentionQuery {
  active: boolean;
  raw: string;              // Full text from @ to cursor
  category: MentionCategory | null;
  search: string;           // Text after category prefix
  startPos: number;         // Position of @ in textarea
  mode: "categories" | "search";
}
```

**Parse logic:**
1. Scan backwards from cursor to find `@` preceded by whitespace or at start
2. If no `@` found: inactive
3. If bare `@`: categories mode
4. If `prefix:search` with known prefix: search mode with category
5. Otherwise: search mode with cross-category search

### `useMentionCandidates`
SWR-based hook that fetches mention candidates.
- When `category` is set: fetches from that category
- When `category` is null + search non-empty: fetches top 10 from each category in parallel via `Promise.allSettled`
- Deduping interval: 2000ms

### `useMentions`
State management for selected mentions.
- `addMention(item)`: Add (deduplicates by id)
- `removeMention(id)`: Remove by id
- `clearMentions()`: Clear all

## File Structure

```
src/components/chat/
  chat-sidebar.tsx      # Main container (desktop + mobile)
  chat-input.tsx        # Controlled textarea + inline mentions + model selector
  chat-message.tsx      # Message display + tools + TOOL_LABELS map
  mention-picker.tsx    # Inline dropdown (categories + search)
  mention-chips.tsx     # Selected mention badges
  tool-renderers/
    registry.tsx          # Maps tool names to renderer components
    approval-renderer.tsx # Approval UI (confirm/deny) for write operations
    write-result-renderer.tsx   # Generic success/failure for write tools
    repo-overview-renderer.tsx  # Repo metadata display
    commit-history-renderer.tsx # Commit list
    commit-detail-renderer.tsx  # Full commit diff
    branch-list-renderer.tsx    # Branch list
    tag-list-renderer.tsx       # Tag list
    compare-diff-renderer.tsx   # Diff between refs
    file-list-renderer.tsx      # Directory listing
    file-content-renderer.tsx   # File content viewer
    contributor-list-renderer.tsx # Contributor avatars
    user-profile-renderer.tsx   # GitHub user profile card
    pr-list-renderer.tsx        # Pull request list
    pr-detail-renderer.tsx      # Pull request detail view

src/hooks/
  use-mention-query/index.ts      # Textarea mention parser
  use-mention-candidates/index.ts # SWR fetcher for mention items
  use-mentions/index.ts           # Selected mentions state

src/lib/mentions/
  types.ts              # MentionItem, MentionCategory, ResolvedMentionContext
  resolve-context.ts    # Fetch full context for mentions on send

src/config/constants.ts # MENTION_CATEGORIES, MENTION_CATEGORY_SHORTCUTS
```

## AI SDK Compliance

1. **useChat hook**: `id`, `transport` with `DefaultChatTransport`
2. **Message rendering**: `message.parts` array with text, tool calls, reasoning
3. **Status management**: `submitted` / `streaming` / `ready` / `error`
4. **Input handling**: `sendMessage({ text })`, clear after send
5. **Stream control**: `stop()` aborts, `setMessages()` for clearing
6. **Tool approval**: `needsApproval: true` on write tools, `addToolApprovalResponse({ id, approved })` for confirm/deny

## Performance

- Auto-scroll only on new messages
- SWR deduping for mention candidates (2000ms)
- Cross-category search parallelized with Promise.allSettled
- Scroll container isolated (only messages scroll)
- Mention query parsed on every keystroke (lightweight string scan)
