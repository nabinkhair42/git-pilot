"use client";

import { ThemeProvider } from "next-themes";
import { Toaster } from "@/components/ui/sonner";
import { ModeProvider } from "@/hooks/use-mode";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem={true}>
      <ModeProvider>
        {children}
      </ModeProvider>
      <Toaster theme="system" position="bottom-right" richColors />
    </ThemeProvider>
  );
}
