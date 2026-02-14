"use client";

import { ChatInput } from "@/components/chat/chat-input";
import { ChatMessages } from "@/components/chat/chat-message";
import { EmptyChatState } from "@/components/chat/empty-chat-state";
import { LoginDialog } from "@/components/auth/login-dialog";
import { Spinner } from "@/components/ui/spinner";
import { useRepo } from "@/hooks/use-repo";
import { useChatHistory } from "@/hooks/use-chat-history";
import { useActiveChat } from "@/hooks/use-active-chat";
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
import { useRouter } from "next/navigation";
import { useMemo, useRef, useEffect, useCallback } from "react";

export function ChatApp({ chatId }: { chatId: string | null }) {
  const { chat: activeChat, isLoading: chatLoading } = useActiveChat(chatId);

  const isLoadingChat = !!chatId && chatLoading;

  return (
    <>
      <LoginDialog />
      {isLoadingChat ? (
        <div className="flex min-h-0 flex-1 items-center justify-center">
          <Spinner className="size-6 text-muted-foreground" />
        </div>
      ) : (
        <ChatAppInner
          key={chatId || "new"}
          activeChatId={chatId}
          initialMessages={activeChat?.messages as UIMessage[] | undefined}
        />
      )}
    </>
  );
}

function ChatAppInner({
  activeChatId,
  initialMessages,
}: {
  activeChatId: string | null;
  initialMessages?: UIMessage[];
}) {
  const { githubOwner, githubRepoName } = useRepo();
  const { mutate: mutateChatHistory } = useChatHistory();
  const router = useRouter();

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

  const { messages, sendMessage, status, stop, addToolApprovalResponse } =
    useChat({
      id: activeChatId || "new-chat",
      transport,
      messages: initialMessages,
      sendAutomaticallyWhen:
        lastAssistantMessageIsCompleteWithApprovalResponses,
    });

  // Save messages when AI response completes (streaming -> ready)
  // Also sync Next.js router state after streaming completes for new chats
  useEffect(() => {
    const wasStreaming = prevStatusRef.current === "streaming";
    prevStatusRef.current = status;

    if (
      wasStreaming &&
      status === "ready" &&
      createdChatIdRef.current &&
      messages.length > 0
    ) {
      chatService
        .saveMessages(createdChatIdRef.current, messages)
        .catch(console.error);
      mutateChatHistory();

      // Sync Next.js router state if URL was updated via history.replaceState
      if (!activeChatId && createdChatIdRef.current) {
        router.replace(`/chats/${createdChatIdRef.current}`);
      }
    }
  }, [status, messages, mutateChatHistory, activeChatId, router]);

  const handleSend = useCallback(
    async (text: string, mentions: MentionItem[]) => {
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
          const newChat = await chatService.createChat();
          createdChatIdRef.current = newChat.id;
          // Update URL without remounting (preserves streaming connection)
          window.history.replaceState(null, "", `/chats/${newChat.id}`);
          mutateChatHistory();

          // Generate title in background
          chatService
            .generateChatTitle(newChat.id, messageText)
            .then(() => {
              mutateChatHistory();
            })
            .catch(console.error);
        } catch (error) {
          console.error("Failed to create chat:", error);
        }
      }

      sendMessage({ text: messageText });
    },
    [githubOwner, githubRepoName, sendMessage, mutateChatHistory],
  );

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      handleSend(suggestion, []);
    },
    [handleSend],
  );

  const isEmpty = messages.length === 0;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {isEmpty ? (
        /* ChatGPT-style: greeting + input centered vertically */
        <div className="flex flex-1 flex-col items-center justify-center px-4">
          <div className="w-full max-w-3xl">
            <EmptyChatState onSuggestionClick={handleSuggestionClick} />
            <div className="mt-8">
              <ChatInput onSend={handleSend} onStop={stop} status={status} />
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col min-h-0">
            <ChatMessages
              messages={messages}
              status={status}
              onSuggestionClick={handleSuggestionClick}
              onAction={(text) => sendMessage({ text })}
              addToolApprovalResponse={addToolApprovalResponse}
            />
          </div>
          <div className="mx-auto w-full max-w-3xl">
            <ChatInput onSend={handleSend} onStop={stop} status={status} />
          </div>
        </>
      )}
    </div>
  );
}
