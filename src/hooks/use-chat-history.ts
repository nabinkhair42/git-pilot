"use client";

import useSWR from "swr";
import * as chatService from "@/services/frontend/chat.services";

export function useChatHistory() {
  const { data, isLoading, error, mutate } = useSWR(
    ["chat-history"],
    () => chatService.getChats()
  );

  return { chats: data ?? [], isLoading, error, mutate };
}
