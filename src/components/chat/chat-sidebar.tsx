"use client";

import { ChatInput } from "@/components/chat/chat-input";
import { ChatMessages } from "@/components/chat/chat-message";
import { useRepo } from "@/hooks/use-repo";
import { cn } from "@/lib/utils";
import { resolveAllMentions, buildMentionContextBlock } from "@/lib/mentions/resolve-context";
import type { MentionItem } from "@/lib/mentions/types";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Bot, MessageSquare, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";

export function ChatSidebar() {
  const { githubOwner, githubRepoName } = useRepo();
  const hasRepo = !!githubOwner && !!githubRepoName;
  const [mobileOpen, setMobileOpen] = useState(false);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: {
          owner: githubOwner,
          repo: githubRepoName,
        },
      }),
    [githubOwner, githubRepoName],
  );

  const { messages, sendMessage, status, stop, setMessages } = useChat({
    id: "repo-chat",
    transport,
  });

  const handleSend = async (text: string, mentions: MentionItem[]) => {
    if (!text.trim() && mentions.length === 0) return;

    let messageText = text;

    if (mentions.length > 0) {
      const resolved = await resolveAllMentions(mentions, {
        owner: githubOwner,
        repo: githubRepoName,
      });
      const contextBlock = buildMentionContextBlock(resolved);
      messageText = text + contextBlock;
    }

    sendMessage({ text: messageText });
  };

  const handleClear = () => {
    setMessages([]);
  };

  const handleSuggestionClick = (suggestion: string) => {
    sendMessage({ text: suggestion });
  };

  // Context usage (placeholder)
  const contextUsed = 0;
  const contextTotal = 200000;
  const contextPercentage = Math.round((contextUsed / contextTotal) * 100);

  return (
    <>
      {/* Mobile trigger */}
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        className={cn(
          "fixed bottom-6 right-6 z-40 flex size-14 items-center justify-center rounded-full",
          "border border-border bg-background shadow-lg lg:hidden",
          "transition-colors hover:bg-white/2",
          mobileOpen && "pointer-events-none opacity-0"
        )}
        aria-label="Open chat"
      >
        <MessageSquare className="size-5 text-muted-foreground" />
      </button>

      {/* Mobile backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity lg:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => setMobileOpen(false)}
        aria-hidden="true"
      />

      {/* Chat sidebar */}
      <aside
        className={cn(
          "flex flex-col overflow-hidden border-l border-border bg-background",
          "lg:w-110",
          "max-lg:fixed max-lg:inset-y-0 max-lg:right-0 max-lg:z-50 max-lg:w-full sm:max-lg:w-110",
          "max-lg:transition-[transform,visibility] max-lg:duration-300",
          mobileOpen
            ? "max-lg:visible max-lg:translate-x-0"
            : "max-lg:invisible max-lg:translate-x-full"
        )}
      >
        {/* Top bar */}
        <div className="flex h-14 shrink-0 items-center justify-between gap-1 border-b border-border px-3">
          <span className="text-sm font-medium">Chat</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground lg:hidden"
              aria-label="Close chat"
            >
              <X className="size-4" />
            </button>
            {messages.length > 0 && (
              <button
                type="button"
                onClick={handleClear}
                className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                title="Clear chat"
              >
                <Trash2 className="size-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Messages (Conversation handles scroll via use-stick-to-bottom) */}
        <div className="min-h-0 flex-1">
          {messages.length === 0 && !hasRepo ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
              <Bot className="size-10 text-muted-foreground/40" />
              <div className="space-y-1">
                <p className="text-sm font-medium">No Repository Selected</p>
                <p className="text-xs text-muted-foreground">
                  Use <kbd className="rounded border border-border px-1 py-0.5 font-mono text-[10px]">@repo:</kbd> to reference a repository, or select one first.
                </p>
              </div>
            </div>
          ) : (
            <ChatMessages
              messages={messages}
              status={status}
              onSuggestionClick={handleSuggestionClick}
            />
          )}
        </div>

        {/* Input (Bottom) */}
        <ChatInput
          onSend={handleSend}
          onStop={stop}
          status={status}
        />
      </aside>
    </>
  );
}
