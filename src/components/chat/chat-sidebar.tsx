"use client";

import { useState } from "react";
import { useChat } from "@ai-sdk/react";
import { ChatMessages } from "@/components/chat/chat-message";
import { ChatInput } from "@/components/chat/chat-input";
import { Bot, MessageSquare, X, Trash2 } from "lucide-react";
import { useRepo } from "@/hooks/use-repo";
import { cn } from "@/lib/utils";

export function ChatSidebar() {
  const { repoPath, mode } = useRepo();
  const isLocalMode = mode === "local" && !!repoPath;
  const [mobileOpen, setMobileOpen] = useState(false);

  const { messages, sendMessage, status, stop, setMessages } = useChat({
    id: "repo-chat",
    api: "/api/chat",
    body: {
      repoPath,
    },
  });

  const handleSend = (text: string) => {
    if (!text.trim()) return;
    sendMessage({ text });
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
          {!isLocalMode ? (
            <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
              <Bot className="size-10 text-muted-foreground/40" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Local Mode Required</p>
                <p className="text-xs text-muted-foreground">
                  Repo Chat is available only for local repositories.
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
        {isLocalMode && (
          <ChatInput
            onSend={handleSend}
            onStop={stop}
            status={status}
          />
        )}

        {/* Footer */}
        <div className="flex h-10 shrink-0 items-center border-t border-border px-4">
          <div className="flex w-full items-center justify-between text-[11px] text-muted-foreground">
            <span>Tokenizer: Off</span>
            <div className="flex items-center gap-1">
              <span>Context:</span>
              <span className="tabular-nums">
                {contextUsed.toLocaleString()}/{(contextTotal / 1000).toLocaleString()}k
              </span>
              <span className="text-muted-foreground/60">({contextPercentage}%)</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
