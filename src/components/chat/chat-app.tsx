"use client";

import { ChatInput } from "@/components/chat/chat-input";
import { ChatMessages } from "@/components/chat/chat-message";
import { EmptyChatState } from "@/components/chat/empty-chat-state";
import { LoginDialog } from "@/components/auth/login-dialog";
import { Spinner } from "@/components/ui/spinner";
import { AI_MODELS, STORAGE_KEYS } from "@/config/constants";
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
import { useMemo, useRef, useEffect, useCallback, useState } from "react";

export function ChatApp({ chatId }: { chatId: string | null }) {
  const { chat: activeChat, isLoading: chatLoading } = useActiveChat(chatId);
  const [resetKey, setResetKey] = useState(0);

  // Listen for "new-chat" events from the sidebar button.
  // This handles the case where replaceState desynchronized the URL from
  // the Next.js router, so a Link to "/" would be a no-op.
  useEffect(() => {
    const handler = () => setResetKey((k) => k + 1);
    window.addEventListener("new-chat", handler);
    return () => window.removeEventListener("new-chat", handler);
  }, []);

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
          key={chatId || `new-${resetKey}`}
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
  const modelRef = useRef<string>(AI_MODELS[0].id);

  // Sync from localStorage after mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEYS.selectedModel);
    if (stored && AI_MODELS.some((m) => m.id === stored)) {
      modelRef.current = stored;
    }
  }, []);

  const createdChatIdRef = useRef<string | null>(activeChatId);
  const chatCreationRef = useRef<Promise<string> | null>(null);
  const prevStatusRef = useRef<string>("ready");

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: () => ({
          owner: githubOwner,
          repo: githubRepoName,
          model: modelRef.current,
        }),
      }),
    [githubOwner, githubRepoName],
  );

  const { messages, sendMessage, status, stop, addToolApprovalResponse } =
    useChat({
      id: activeChatId || "new-chat",
      transport,
      messages: initialMessages ?? [],
      sendAutomaticallyWhen:
        lastAssistantMessageIsCompleteWithApprovalResponses,
    });

  // Save messages when AI response completes (any non-ready → ready)
  useEffect(() => {
    const prevStatus = prevStatusRef.current;
    prevStatusRef.current = status;

    if (prevStatus !== "ready" && status === "ready" && messages.length > 0) {
      const save = (chatId: string) => {
        chatService.saveMessages(chatId, messages).catch(console.error);
        mutateChatHistory();
      };

      if (createdChatIdRef.current) {
        save(createdChatIdRef.current);
      } else if (chatCreationRef.current) {
        // Chat creation in progress — wait for it, then save
        chatCreationRef.current.then(save).catch(console.error);
      }
    }
  }, [status, messages, mutateChatHistory]);

  const handleSend = useCallback(
    async (text: string, mentions: MentionItem[], model: string) => {
      if (!text.trim() && mentions.length === 0) return;

      // Update model ref — read by transport body function at send time
      modelRef.current = model;

      let messageText = text;

      if (mentions.length > 0) {
        const resolved = await resolveAllMentions(mentions, {
          owner: githubOwner,
          repo: githubRepoName,
        });
        const contextBlock = buildMentionContextBlock(resolved);
        messageText = text + contextBlock;
      }

      // Send message immediately — don't block on chat creation
      sendMessage({ text: messageText });

      // Create chat in background if this is a new conversation
      if (!createdChatIdRef.current && !chatCreationRef.current) {
        chatCreationRef.current = chatService
          .createChat()
          .then((newChat) => {
            createdChatIdRef.current = newChat.id;
            window.history.replaceState(null, "", `/chats/${newChat.id}`);
            mutateChatHistory();

            // Generate title in background
            // Skip AI title gen for local models (LM Studio can only handle one request at a time)
            const isLocalModel = model.startsWith("lmstudio");
            if (isLocalModel) {
              const fallback = messageText.slice(0, 50).trim() || "New chat";
              chatService
                .updateChat(newChat.id, { title: fallback })
                .then(() => mutateChatHistory())
                .catch(console.error);
            } else {
              chatService
                .generateChatTitle(newChat.id, messageText, model)
                .then(() => mutateChatHistory())
                .catch(() => {
                  // Silently fallback — title gen may timeout
                  const fallback = messageText.slice(0, 50).trim() || "New chat";
                  chatService
                    .updateChat(newChat.id, { title: fallback })
                    .then(() => mutateChatHistory())
                    .catch(console.error);
                });
            }

            return newChat.id;
          });

        chatCreationRef.current.catch(console.error);
      }
    },
    [githubOwner, githubRepoName, sendMessage, mutateChatHistory],
  );

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      handleSend(suggestion, [], modelRef.current);
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
          <div className="mx-auto w-full max-w-3xl backdrop-blur">
            <ChatInput onSend={handleSend} onStop={stop} status={status} />
          </div>
        </>
      )}
    </div>
  );
}
