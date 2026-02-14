"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ModeProvider } from "@/hooks/use-mode";
import { SidebarProvider } from "@/hooks/use-sidebar";
import { ChatNavigationProvider } from "@/hooks/use-chat-navigation";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem={true}>
      <TooltipProvider delayDuration={200}>
        <ModeProvider>
          <SidebarProvider>
            <ChatNavigationProvider>
              {children}
            </ChatNavigationProvider>
          </SidebarProvider>
        </ModeProvider>
        <Toaster
          theme="system"
          position="bottom-right"
          richColors
        />
      </TooltipProvider>
    </ThemeProvider>
  );
}
