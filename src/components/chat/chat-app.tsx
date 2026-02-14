"use client";

import { ChatInput } from "@/components/chat/chat-input";
import { ChatMessages } from "@/components/chat/chat-message";
import { EmptyChatState } from "@/components/chat/empty-chat-state";
import { LoginDialog } from "@/components/auth/login-dialog";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { useMode } from "@/hooks/use-mode";
import { useRepo } from "@/hooks/use-repo";
import { useChatNavigation } from "@/hooks/use-chat-navigation";
import { useChatHistory } from "@/hooks/use-chat-history";
import { useActiveChat } from "@/hooks/use-active-chat";
import { cn } from "@/lib/utils";
import {
  resolveAllMentions,
  buildMentionContextBlock,
} from "@/lib/mentions/resolve-context";
import type { MentionItem } from "@/lib/mentions/types";
import * as chatService from "@/services/frontend/chat.services";
import { useChat } from "@ai-sdk/react";
import type { UIMessage } from "ai";
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithApprovalResponses,
} from "ai";
import { X } from "lucide-react";
import { useMemo, useRef, useEffect, useCallback } from "react";

export function ChatApp() {
  const { activeChatId, setActiveChatId } = useChatNavigation();
  const { chat: activeChat, isLoading: chatLoading } = useActiveChat(activeChatId);

  // Wait for chat data before mounting ChatAppInner so useChat
  // gets the loaded messages on first render (avoids race condition)
  const isLoadingChat = !!activeChatId && chatLoading;

  return (
    <>
      <LoginDialog />
      {isLoadingChat ? (
        <div className="flex min-h-0 flex-1 flex-col">
          <header className="flex h-14 shrink-0 items-center border-b border-border px-4 sm:px-6">
            <Skeleton className="h-4 w-48" />
          </header>
          <div className="flex flex-1 items-center justify-center">
            <Spinner className="size-6 text-muted-foreground" />
          </div>
        </div>
      ) : (
        <ChatAppInner
          key={activeChatId || "new"}
          activeChatId={activeChatId}
          setActiveChatId={setActiveChatId}
          initialMessages={activeChat?.messages as UIMessage[] | undefined}
          chatTitle={activeChat?.title}
        />
      )}
    </>
  );
}

function ChatAppInner({
  activeChatId,
  setActiveChatId,
  initialMessages,
  chatTitle,
}: {
  activeChatId: string | null;
  setActiveChatId: (id: string | null) => void;
  initialMessages?: UIMessage[];
  chatTitle?: string;
}) {
  const { githubRepo, setGitHubRepo } = useMode();
  const { githubOwner, githubRepoName } = useRepo();
  const { mutate: mutateChatHistory } = useChatHistory();
  const hasRepo = !!githubOwner && !!githubRepoName;

  const createdChatIdRef = useRef<string | null>(activeChatId);
  const prevStatusRef = useRef<string>("ready");

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

  const { messages, sendMessage, status, stop, setMessages, addToolApprovalResponse } = useChat({
    id: activeChatId || "new-chat",
    transport,
    messages: initialMessages,
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
  });

  // Save messages when AI response completes (streaming -> ready)
  useEffect(() => {
    const wasStreaming = prevStatusRef.current === "streaming";
    prevStatusRef.current = status;

    if (wasStreaming && status === "ready" && createdChatIdRef.current && messages.length > 0) {
      chatService.saveMessages(createdChatIdRef.current, messages).catch(console.error);
      mutateChatHistory();
    }
  }, [status, messages, mutateChatHistory]);

  const handleSend = useCallback(async (text: string, mentions: MentionItem[]) => {
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

    // If no active chat, create one first
    if (!createdChatIdRef.current) {
      try {
        const newChat = await chatService.createChat({
          repoOwner: githubOwner ?? undefined,
          repoName: githubRepoName ?? undefined,
        });
        createdChatIdRef.current = newChat.id;
        setActiveChatId(newChat.id);
        mutateChatHistory();

        // Generate title in background
        chatService.generateChatTitle(newChat.id, messageText).then(() => {
          mutateChatHistory();
        }).catch(console.error);
      } catch (error) {
        console.error("Failed to create chat:", error);
      }
    }

    sendMessage({ text: messageText });
  }, [githubOwner, githubRepoName, sendMessage, setActiveChatId, mutateChatHistory]);

  const handleSuggestionClick = useCallback((suggestion: string) => {
    handleSend(suggestion, []);
  }, [handleSend]);

  const isEmpty = messages.length === 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* Top bar */}
      <header className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-border px-4 sm:px-6">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="truncate text-sm font-medium text-foreground">
            {chatTitle || ""}
          </span>
          {hasRepo && (
            <span className="shrink-0 rounded-md bg-muted px-2 py-0.5 font-mono text-xs text-muted-foreground">
              {githubRepo?.fullName}
            </span>
          )}
        </div>
        {hasRepo && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setGitHubRepo(null);
              setMessages([]);
            }}
          >
            <X className="size-3.5" />
            <span className="hidden sm:inline">Change repo</span>
          </Button>
        )}
      </header>

      {/* Main content */}
      {isEmpty ? (
        /* ChatGPT-style: greeting + input centered vertically */
        <div className="flex flex-1 flex-col items-center justify-center px-4">
          <div className="w-full max-w-3xl">
            <EmptyChatState onSuggestionClick={handleSuggestionClick} />
            <div className="mt-8">
              <ChatInput
                onSend={handleSend}
                onStop={stop}
                status={status}
              />
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className={cn("mx-auto flex w-full max-w-3xl flex-1 flex-col min-h-0")}>
            <ChatMessages
              messages={messages}
              status={status}
              onSuggestionClick={handleSuggestionClick}
              onAction={(text) => sendMessage({ text })}
              addToolApprovalResponse={addToolApprovalResponse}
            />
          </div>
          <div className="mx-auto w-full max-w-3xl">
            <ChatInput
              onSend={handleSend}
              onStop={stop}
              status={status}
            />
          </div>
        </>
      )}
    </div>
  );
}
