"use client";

import { GitManagerAppIcon } from "@/components/icons/git-manager";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import { useSession } from "@/lib/auth/auth-client";
import { useTheme } from "next-themes";
import { SquarePen, Sun, Moon, PanelLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { ChatHistoryList } from "./chat-history-list";

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  return (
    <span
      role="button"
      tabIndex={0}
      className="inline-flex size-7 shrink-0 items-center justify-center rounded-md hover:bg-sidebar-accent"
      onClick={(e) => {
        e.stopPropagation();
        setTheme(resolvedTheme === "dark" ? "light" : "dark");
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.stopPropagation();
          setTheme(resolvedTheme === "dark" ? "light" : "dark");
        }
      }}
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
    </span>
  );
}

export function AppSidebar() {
  const { data: session } = useSession();
  const { state, toggleSidebar } = useSidebar();
  const router = useRouter();
  const isCollapsed = state === "collapsed";
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu className="bg-transparent hover:bg-transparent">
          <SidebarMenuItem className="bg-transparent hover:bg-transparent">
            {isCollapsed ? (
              <SidebarMenuButton
                tooltip="Expand sidebar"
                onClick={toggleSidebar}
              >
                <PanelLeft />
              </SidebarMenuButton>
            ) : (
              <SidebarMenuButton
                size="lg"
                asChild
                tooltip="GitPilot"
                className="bg-transparent hover:bg-transparent"
              >
                <Link href="/">
                  <GitManagerAppIcon />
                  <span>GitPilot</span>
                </Link>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip="New chat"
              onClick={() => {
                window.dispatchEvent(new CustomEvent("new-chat"));
                router.push("/");
              }}
            >
              <SquarePen className="size-4" />
              <span>New chat</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <ChatHistoryList />
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip={session?.user.name ?? "Guest"}
              className="flex w-full justify-between"
            >
              <div className="flex items-center gap-2">
                {mounted && session?.user.image ? (
                  <img
                    src={session.user.image}
                    alt=""
                    className="size-5 shrink-0 rounded-full"
                  />
                ) : (
                  <div className="size-5 shrink-0 rounded-full bg-sidebar-accent" />
                )}
                <span className="truncate text-xs font-medium">
                  {mounted ? (session?.user.name ?? "Guest") : "Guest"}
                </span>
              </div>
              <ThemeToggle />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
