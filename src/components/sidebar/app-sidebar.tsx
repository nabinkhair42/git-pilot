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
import { SquarePen, PanelLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChatHistoryList } from "./chat-history-list";
import { UserControl } from "./user-control";

export function AppSidebar() {
  const { state, toggleSidebar } = useSidebar();
  const router = useRouter();
  const isCollapsed = state === "collapsed";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu className="bg-transparent hover:bg-transparent">
          <SidebarMenuItem className="bg-transparent hover:bg-transparent">
            {isCollapsed ? (
              <SidebarMenuButton tooltip="Expand sidebar" onClick={toggleSidebar}>
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

      <SidebarContent className="mask-[linear-gradient(to_bottom,black_calc(100%-3rem),transparent_100%)]">
        <ChatHistoryList />
      </SidebarContent>

      <SidebarFooter>
        <UserControl />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
