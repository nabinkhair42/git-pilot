"use client";

import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut, useSession } from "@/lib/auth/auth-client";
import { useTheme } from "next-themes";
import { Sun, Moon, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export function UserControl() {
  const { data: session } = useSession();
  const { resolvedTheme, setTheme } = useTheme();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const isDark = mounted && resolvedTheme === "dark";

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton tooltip={session?.user.name ?? "Guest"}>
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
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent side="top" align="start" className="w-56">
            <DropdownMenuLabel className="flex flex-col gap-0.5">
              <span className="text-sm font-medium">
                {session?.user.name ?? "Guest"}
              </span>
              {session?.user.email && (
                <span className="truncate text-xs font-normal text-muted-foreground">
                  {session.user.email}
                </span>
              )}
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={() => setTheme(isDark ? "light" : "dark")}>
              {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
              {isDark ? "Light mode" : "Dark mode"}
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              variant="destructive"
              onClick={() =>
                signOut({ fetchOptions: { onSuccess: () => router.push("/") } })
              }
            >
              <LogOut className="size-4" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
