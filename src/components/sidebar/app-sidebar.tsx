"use client";

import { GitManagerAppIcon } from "@/components/icons/git-manager";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSidebar } from "@/hooks/use-sidebar";
import { useChatNavigation } from "@/hooks/use-chat-navigation";
import { useSession } from "@/lib/auth-client";
import { useTheme } from "next-themes";
import { PanelLeftClose, PanelLeft, SquarePen, Sun, Moon } from "lucide-react";
import { useEffect, useState } from "react";
import { ChatHistoryList } from "./chat-history-list";

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        >
          {mounted ? (
            resolvedTheme === "dark" ? (
              <Sun className="size-3.5" />
            ) : (
              <Moon className="size-3.5" />
            )
          ) : (
            <span className="size-3.5" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="top">Toggle theme</TooltipContent>
    </Tooltip>
  );
}

export function AppSidebar() {
  const { isOpen, toggle } = useSidebar();
  const { startNewChat } = useChatNavigation();
  const { data: session } = useSession();

  /* ── Collapsed rail ── */
  if (!isOpen) {
    return (
      <aside className="flex h-full w-12 shrink-0 flex-col items-center border-r border-sidebar-border bg-sidebar py-3 text-sidebar-foreground">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon-sm" onClick={toggle}>
              <PanelLeft className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">Open sidebar</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="mt-2"
              onClick={startNewChat}
            >
              <SquarePen className="size-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">New chat</TooltipContent>
        </Tooltip>

        {/* User avatar at bottom */}
        <div className="mt-auto">
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" className="rounded-full" onClick={toggle}>
                {session?.user.image ? (
                  <img
                    src={session.user.image}
                    alt=""
                    className="size-7 rounded-full"
                  />
                ) : (
                  <div className="size-7 rounded-full bg-sidebar-accent" />
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {session?.user.name ?? "Guest"}
            </TooltipContent>
          </Tooltip>
        </div>
      </aside>
    );
  }

  /* ── Expanded sidebar ── */
  return (
    <aside className="flex h-full w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
      {/* Top row */}
      <div className="flex h-14 shrink-0 items-center justify-between gap-1 px-3">
        <div className="flex items-center gap-2">
          <GitManagerAppIcon className="size-5 shrink-0 text-sidebar-foreground" />
          <span className="text-sm font-semibold tracking-tight">GitPilot</span>
        </div>
        <div className="flex items-center gap-0.5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" onClick={startNewChat}>
                <SquarePen className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>New chat</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" onClick={toggle}>
                <PanelLeftClose className="size-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Close sidebar</TooltipContent>
          </Tooltip>
        </div>
      </div>

      {/* Chat history */}
      <ScrollArea className="flex-1">
        <ChatHistoryList />
      </ScrollArea>

      {/* Bottom: user + theme */}
      <div className="flex shrink-0 items-center gap-2 border-t border-sidebar-border px-3 py-2.5">
        {session?.user.image ? (
          <img
            src={session.user.image}
            alt=""
            className="size-6 shrink-0 rounded-full"
          />
        ) : (
          <div className="size-6 shrink-0 rounded-full bg-sidebar-accent" />
        )}
        <span className="min-w-0 flex-1 truncate text-xs font-medium">
          {session?.user.name ?? "Guest"}
        </span>
        <ThemeToggle />
      </div>
    </aside>
  );
}
