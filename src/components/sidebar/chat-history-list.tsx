"use client";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useChatHistory } from "@/hooks/use-chat-history";
import { useChatNavigation } from "@/hooks/use-chat-navigation";
import { cn } from "@/lib/utils";
import * as chatService from "@/services/frontend/chat.services";
import { isToday, isYesterday, subDays, isAfter } from "date-fns";
import { MessageSquare, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

type ChatEntry = { id: string; title: string; updatedAt: string };

interface ChatGroup {
  label: string;
  chats: ChatEntry[];
}

function groupChatsByDate(items: ChatEntry[]): ChatGroup[] {
  const groups: Record<string, ChatEntry[]> = {
    Today: [],
    Yesterday: [],
    "Previous 7 days": [],
    "Previous 30 days": [],
    Older: [],
  };

  const now = new Date();
  const sevenDaysAgo = subDays(now, 7);
  const thirtyDaysAgo = subDays(now, 30);

  for (const chat of items) {
    const date = new Date(chat.updatedAt);
    if (isToday(date)) {
      groups["Today"].push(chat);
    } else if (isYesterday(date)) {
      groups["Yesterday"].push(chat);
    } else if (isAfter(date, sevenDaysAgo)) {
      groups["Previous 7 days"].push(chat);
    } else if (isAfter(date, thirtyDaysAgo)) {
      groups["Previous 30 days"].push(chat);
    } else {
      groups["Older"].push(chat);
    }
  }

  return Object.entries(groups)
    .filter(([, items]) => items.length > 0)
    .map(([label, chats]) => ({ label, chats }));
}

export function ChatHistoryList() {
  const { chats, isLoading, mutate } = useChatHistory();
  const { activeChatId, setActiveChatId } = useChatNavigation();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const groups = useMemo(() => groupChatsByDate(chats), [chats]);

  if (isLoading) {
    return (
      <div className="space-y-3 p-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full rounded-md" />
        ))}
      </div>
    );
  }

  if (chats.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 px-3 py-8 text-center">
        <MessageSquare className="size-5 text-sidebar-foreground/40" />
        <p className="text-xs text-sidebar-foreground/60">No chats yet</p>
      </div>
    );
  }

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeletingId(id);
    try {
      await chatService.deleteChat(id);
      if (activeChatId === id) {
        setActiveChatId(null);
      }
      mutate();
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="px-2 py-2">
      {groups.map((group) => (
        <div key={group.label}>
          <div className="px-2 py-1.5">
            <span className="text-[11px] font-medium text-sidebar-foreground/50">
              {group.label}
            </span>
          </div>
          {group.chats.map((chat) => (
            <div
              key={chat.id}
              role="button"
              tabIndex={0}
              onClick={() => setActiveChatId(chat.id)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setActiveChatId(chat.id);
                }
              }}
              className={cn(
                "group relative flex w-full cursor-pointer items-center rounded-lg px-2 py-2 text-left text-sm transition-colors hover:bg-sidebar-accent",
                activeChatId === chat.id &&
                  "bg-sidebar-accent text-sidebar-accent-foreground"
              )}
            >
              <span className="min-w-0 flex-1 truncate pr-6">
                {chat.title}
              </span>
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={(e) => handleDelete(e, chat.id)}
                disabled={deletingId === chat.id}
                className="absolute right-1 hidden text-sidebar-foreground/40 hover:text-destructive group-hover:flex"
              >
                <Trash2 className="size-3" />
              </Button>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
