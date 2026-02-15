"use client";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
  SidebarMenuSkeleton,
} from "@/components/ui/sidebar";
import { useChatHistory } from "@/hooks/use-chat-history";
import * as chatService from "@/services/frontend/chat.services";
import { isToday, isYesterday, subDays, isAfter } from "date-fns";
import { MessageSquare, Trash2 } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useMemo, useState, useCallback } from "react";
import { DeleteChatDialog } from "../dialog-window/delete-chat-dialog";

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
  const pathname = usePathname();
  const router = useRouter();
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const activeChatId = pathname.startsWith("/chats/")
    ? pathname.split("/")[2]
    : null;

  const groups = useMemo(() => groupChatsByDate(chats), [chats]);

  const handleDeleteClick = useCallback((e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDeleteTarget(id);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await chatService.deleteChat(deleteTarget);
      if (activeChatId === deleteTarget) {
        router.push("/");
      }
      mutate();
    } finally {
      setIsDeleting(false);
      setDeleteTarget(null);
    }
  }, [deleteTarget, activeChatId, router, mutate]);

  if (isLoading) {
    return (
      <SidebarGroup className="group-data-[collapsible=icon]:hidden">
        <SidebarMenu>
          {Array.from({ length: 5 }).map((_, i) => (
            <SidebarMenuItem key={i}>
              <SidebarMenuSkeleton />
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroup>
    );
  }

  if (chats.length === 0) {
    return (
      <SidebarGroup className="group-data-[collapsible=icon]:hidden">
        <div className="flex flex-col items-center gap-2 px-3 py-8 text-center">
          <MessageSquare className="size-5 text-sidebar-foreground/40" />
          <p className="text-xs text-sidebar-foreground/60">No chats yet</p>
        </div>
      </SidebarGroup>
    );
  }

  return (
    <>
      {groups.map((group) => (
        <SidebarGroup key={group.label} className="group-data-[collapsible=icon]:hidden">
          <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
          <SidebarMenu>
            {group.chats.map((chat) => (
              <SidebarMenuItem key={chat.id}>
                <SidebarMenuButton
                  asChild
                  isActive={activeChatId === chat.id}
                  tooltip={chat.title}
                >
                  <Link href={`/chats/${chat.id}`}>
                    <span className="truncate">{chat.title}</span>
                  </Link>
                </SidebarMenuButton>
                <SidebarMenuAction
                  showOnHover
                  onClick={(e) => handleDeleteClick(e, chat.id)}
                >
                  <Trash2 className="size-3" />
                </SidebarMenuAction>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      ))}

      <DeleteChatDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        onConfirm={handleDeleteConfirm}
        isDeleting={isDeleting}
      />
    </>
  );
}
