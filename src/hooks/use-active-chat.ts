"use client";

import useSWR from "swr";
import * as chatService from "@/services/frontend/chat.services";

export function useActiveChat(chatId: string | null) {
  const { data, isLoading, error, mutate } = useSWR(
    chatId ? ["chat", chatId] : null,
    () => chatService.getChat(chatId!)
  );

  return { chat: data ?? null, isLoading, error, mutate };
}
