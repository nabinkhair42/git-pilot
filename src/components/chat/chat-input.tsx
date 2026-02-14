"use client";

import {
  ModelSelector,
  ModelSelectorContent,
  ModelSelectorEmpty,
  ModelSelectorGroup,
  ModelSelectorInput,
  ModelSelectorItem,
  ModelSelectorList,
  ModelSelectorLogo,
  ModelSelectorName,
  ModelSelectorTrigger,
} from "@/components/ai-elements/model-selector";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputHeader,
  PromptInputProvider,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputTools,
  usePromptInputController,
} from "@/components/ai-elements/prompt-input";
import { MentionChips } from "@/components/chat/mention-chips";
import { MentionPicker } from "@/components/chat/mention-picker";
import { Button } from "@/components/ui/button";
import { MENTION_CATEGORY_SHORTCUTS } from "@/config/constants";
import { useMentionQuery } from "@/hooks/use-mention-query";
import { useMentions } from "@/hooks/use-mentions";
import type { MentionCategory, MentionItem } from "@/lib/mentions/types";
import type { ChatStatus } from "ai";
import { AtSign } from "lucide-react";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type KeyboardEvent,
} from "react";

const MODELS = [
  { id: "gpt-4o", name: "GPT-4o", provider: "openai" as const },
  {
    id: "claude-sonnet-4-5-20250929",
    name: "Claude Sonnet 4.5",
    provider: "anthropic" as const,
  },
  {
    id: "claude-opus-4-6",
    name: "Claude Opus 4.6",
    provider: "anthropic" as const,
  },
  { id: "grok-3", name: "Grok 3", provider: "xai" as const },
];

interface ChatInputProps {
  onSend: (text: string, mentions: MentionItem[]) => void;
  onStop: () => void;
  status: ChatStatus;
  disabled?: boolean;
}

// Reverse map: MentionCategory → shortcut string (e.g., "repository" → "repo")
const CATEGORY_TO_SHORTCUT: Record<string, string> = {};
for (const [shortcut, cat] of Object.entries(MENTION_CATEGORY_SHORTCUTS)) {
  CATEGORY_TO_SHORTCUT[cat] = shortcut;
}

// ── Highlight overlay helpers ──

interface TextSegment {
  text: string;
  highlight: boolean;
}

function buildHighlightSegments(
  text: string,
  mentions: MentionItem[]
): TextSegment[] {
  if (!text || mentions.length === 0)
    return [{ text: text || "", highlight: false }];

  // Build exact search strings from confirmed mentions
  const patterns = mentions.map((m) => {
    const shortcut = CATEGORY_TO_SHORTCUT[m.category] ?? m.category;
    return `@${shortcut}:${m.label}`;
  });

  // Find all occurrences
  const ranges: { start: number; end: number }[] = [];
  for (const pattern of patterns) {
    let idx = text.indexOf(pattern);
    while (idx !== -1) {
      ranges.push({ start: idx, end: idx + pattern.length });
      idx = text.indexOf(pattern, idx + 1);
    }
  }

  if (ranges.length === 0) return [{ text, highlight: false }];

  ranges.sort((a, b) => a.start - b.start);

  const segments: TextSegment[] = [];
  let pos = 0;
  for (const range of ranges) {
    if (range.start > pos) {
      segments.push({ text: text.slice(pos, range.start), highlight: false });
    }
    segments.push({
      text: text.slice(range.start, range.end),
      highlight: true,
    });
    pos = range.end;
  }
  if (pos < text.length) {
    segments.push({ text: text.slice(pos), highlight: false });
  }

  return segments;
}

function MentionHighlightOverlay({
  text,
  mentions,
  textareaRef,
}: {
  text: string;
  mentions: MentionItem[];
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
}) {
  const overlayRef = useRef<HTMLDivElement>(null);

  const segments = useMemo(
    () => buildHighlightSegments(text, mentions),
    [text, mentions]
  );

  // Sync scroll position with textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const handler = () => {
      if (overlayRef.current) {
        overlayRef.current.scrollTop = textarea.scrollTop;
      }
    };
    textarea.addEventListener("scroll", handler);
    return () => textarea.removeEventListener("scroll", handler);
  }, [textareaRef]);

  const hasHighlights = segments.some((s) => s.highlight);
  if (!hasHighlights) return null;

  return (
    <div
      ref={overlayRef}
      aria-hidden
      className="pointer-events-none absolute inset-0 overflow-hidden whitespace-pre-wrap break-words px-3 py-2 text-base leading-[inherit] md:text-sm"
    >
      {segments.map((seg, i) =>
        seg.highlight ? (
          <mark
            key={i}
            className="rounded-sm bg-sky-500/15 text-transparent"
          >
            {seg.text}
          </mark>
        ) : (
          <span key={i} className="text-transparent">
            {seg.text}
          </span>
        )
      )}
    </div>
  );
}

export function ChatInput(props: ChatInputProps) {
  return (
    <PromptInputProvider>
      <ChatInputInner {...props} />
    </PromptInputProvider>
  );
}

function ChatInputInner({
  onSend,
  onStop,
  status,
  disabled,
}: ChatInputProps) {
  const { textInput } = usePromptInputController();
  const [selectedModel, setSelectedModel] = useState(MODELS[0].id);
  const [modelSelectorOpen, setModelSelectorOpen] = useState(false);

  const { mentions, addMention, removeMention, clearMentions } = useMentions();
  const { query, updateQuery, clearQuery } = useMentionQuery();

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // Track cursor position in a ref so it survives focus loss (clicking picker)
  const cursorPosRef = useRef(0);

  const currentModel = MODELS.find((m) => m.id === selectedModel) ?? MODELS[0];

  // ── Handlers ──

  const handleChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      const el = e.currentTarget;
      const pos = el.selectionStart ?? el.value.length;
      cursorPosRef.current = pos;
      updateQuery(el.value, pos);
    },
    [updateQuery]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      // Keep cursor ref in sync on every keydown
      const pos = e.currentTarget.selectionStart ?? cursorPosRef.current;
      cursorPosRef.current = pos;

      if (query.active) {
        if (e.key === "Escape") {
          e.preventDefault();
          clearQuery();
          return;
        }
        // When picker is open, prevent form submit on Enter
        if (e.key === "Enter") {
          e.preventDefault();
          return;
        }
      }
    },
    [query.active, clearQuery]
  );

  const handleSelect = useCallback(
    (item: MentionItem) => {
      const text = textInput.value;
      // Use the ref-tracked cursor position (survives focus loss from clicking picker)
      const cursorPos = cursorPosRef.current;
      // Build inline mention text: @category:label
      const shortcut = CATEGORY_TO_SHORTCUT[item.category] ?? item.category;
      const mention = `@${shortcut}:${item.label} `;
      // Replace the @... text with the formatted mention
      const newText = text.slice(0, query.startPos) + mention + text.slice(cursorPos);
      const newCursorPos = query.startPos + mention.length;
      textInput.setInput(newText);
      cursorPosRef.current = newCursorPos;
      addMention(item);
      clearQuery();
      // Place cursor right after the mention and focus
      requestAnimationFrame(() => {
        const el = textareaRef.current;
        if (el) {
          el.focus();
          el.setSelectionRange(newCursorPos, newCursorPos);
        }
      });
    },
    [textInput, query.startPos, addMention, clearQuery]
  );

  const handleSelectCategory = useCallback(
    (category: MentionCategory) => {
      const text = textInput.value;
      const cursorPos = cursorPosRef.current;
      const shortcut = CATEGORY_TO_SHORTCUT[category] ?? category;
      // Replace from @ to cursor with @shortcut:
      const insertion = `@${shortcut}:`;
      const newText = text.slice(0, query.startPos) + insertion + text.slice(cursorPos);
      textInput.setInput(newText);
      const newCursorPos = query.startPos + insertion.length;
      cursorPosRef.current = newCursorPos;
      // Update query for the new text
      updateQuery(newText, newCursorPos);
      // Set cursor to right after the colon
      requestAnimationFrame(() => {
        const el = textareaRef.current;
        if (el) {
          el.focus();
          el.setSelectionRange(newCursorPos, newCursorPos);
        }
      });
    },
    [textInput, query.startPos, updateQuery]
  );

  const handleClose = useCallback(() => {
    clearQuery();
  }, [clearQuery]);

  const handleAtButtonClick = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    const pos = el.selectionStart ?? textInput.value.length;
    const text = textInput.value;
    // Insert @ at cursor position
    const newText = text.slice(0, pos) + "@" + text.slice(pos);
    textInput.setInput(newText);
    const newPos = pos + 1;
    cursorPosRef.current = newPos;
    updateQuery(newText, newPos);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(newPos, newPos);
    });
  }, [textInput, updateQuery]);

  return (
    <div className="relative shrink-0">
      <MentionPicker
        query={query}
        onSelect={handleSelect}
        onSelectCategory={handleSelectCategory}
        onClose={handleClose}
      />

      <PromptInput
        onSubmit={(message) => {
          if (message.text.trim() || mentions.length > 0) {
            onSend(message.text.trim(), mentions);
            clearMentions();
            clearQuery();
          }
        }}
      >
        <PromptInputHeader>
          <MentionChips mentions={mentions} onRemove={removeMention} />
        </PromptInputHeader>

        <div className="relative w-full">
          <MentionHighlightOverlay
            text={textInput.value}
            mentions={mentions}
            textareaRef={textareaRef}
          />
          <PromptInputTextarea
            ref={textareaRef}
            placeholder="Ask questions about the repo"
            disabled={disabled}
            className="min-h-10"
            onKeyDown={handleKeyDown}
            onChange={handleChange}
          />
        </div>
        <PromptInputFooter>
          <PromptInputTools>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 px-2 text-xs text-muted-foreground"
              type="button"
              onClick={handleAtButtonClick}
              title="Reference repo entities (@)"
            >
              <AtSign className="size-3.5" />
            </Button>


            <ModelSelector
              open={modelSelectorOpen}
              onOpenChange={setModelSelectorOpen}
            >
              <ModelSelectorTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1.5 px-2 text-xs"
                  type="button"
                >
                  <ModelSelectorLogo provider={currentModel.provider} />
                  {currentModel.name}
                </Button>
              </ModelSelectorTrigger>
              <ModelSelectorContent>
                <ModelSelectorInput placeholder="Search models..." />
                <ModelSelectorList>
                  <ModelSelectorEmpty>No models found.</ModelSelectorEmpty>
                  <ModelSelectorGroup>
                    {MODELS.map((model) => (
                      <ModelSelectorItem
                        key={model.id}
                        value={model.id}
                        onSelect={() => {
                          setSelectedModel(model.id);
                          setModelSelectorOpen(false);
                        }}
                      >
                        <ModelSelectorLogo provider={model.provider} />
                        <ModelSelectorName>{model.name}</ModelSelectorName>
                      </ModelSelectorItem>
                    ))}
                  </ModelSelectorGroup>
                </ModelSelectorList>
              </ModelSelectorContent>
            </ModelSelector>
          </PromptInputTools>

          <PromptInputSubmit
            status={status}
            onStop={onStop}
            disabled={disabled}
          />
        </PromptInputFooter>
      </PromptInput>
    </div>
  );
}
