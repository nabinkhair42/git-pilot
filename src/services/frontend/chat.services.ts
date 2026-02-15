import api from "@/config/axios";
import type { UIMessage } from "ai";

function unwrap<T>(res: { data: { success: boolean; data: T } }): T {
  return res.data.data;
}

// ─── Types ──────────────────────────────────────────────────────────────────

export interface ChatItem {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatDetail extends ChatItem {
  messages: {
    id: string;
    chatId: string;
    role: string;
    parts: UIMessage["parts"];
    createdAt: string;
  }[];
}

// ─── API ────────────────────────────────────────────────────────────────────

export async function getChats() {
  return unwrap<ChatItem[]>(await api.get("/chats"));
}

export async function getChat(id: string) {
  return unwrap<ChatDetail>(await api.get(`/chats/${id}`));
}

export async function createChat(data?: { title?: string }) {
  return unwrap<ChatItem>(await api.post("/chats", data));
}

export async function updateChat(id: string, data: { title?: string }) {
  return unwrap<ChatItem>(await api.patch(`/chats/${id}`, data));
}

export async function deleteChat(id: string) {
  return unwrap<{ success: boolean }>(await api.delete(`/chats/${id}`));
}

export async function saveMessages(id: string, messages: UIMessage[]) {
  return unwrap<{ saved: number }>(
    await api.post(`/chats/${id}/messages`, { messages })
  );
}

export async function generateChatTitle(id: string, firstMessage: string, model?: string) {
  return unwrap<{ title: string }>(
    await api.post(`/chats/${id}/generate-title`, { firstMessage, model })
  );
}
