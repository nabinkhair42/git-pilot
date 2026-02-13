"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { ChatMessages } from "@/components/chat/chat-message";
import { ChatInput } from "@/components/chat/chat-input";
import { Bot, Sparkles, Trash2 } from "lucide-react";
import { useRepo } from "@/hooks/use-repo";
import { Badge } from "@/components/ui/badge";

interface ChatPanelProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChatPanel({ open, onOpenChange }: ChatPanelProps) {
  const { repoPath, mode } = useRepo();
  const isLocalMode = mode === "local" && !!repoPath;

  const { messages, sendMessage, status, stop, setMessages } = useChat({
    id: "repo-chat",
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: () => ({
        repoPath,
      }),
    }),
  });

  const handleSend = (text: string) => {
    if (!text.trim()) return;
    sendMessage({ text });
  };

  const handleClear = () => {
    setMessages([]);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        showCloseButton={true}
        className="flex w-full flex-col p-0 sm:max-w-[440px]"
      >
        {/* Header */}
        <SheetHeader className="flex-row items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/10">
              <Sparkles className="size-4 text-primary" />
            </div>
            <div>
              <SheetTitle className="text-sm font-semibold">
                Repo Chat
              </SheetTitle>
              <p className="text-[11px] text-muted-foreground">
                AI-powered repository assistant
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {messages.length > 0 && (
              <Button
                size="icon-xs"
                variant="ghost"
                onClick={handleClear}
                title="Clear chat"
              >
                <Trash2 className="size-3.5" />
              </Button>
            )}
          </div>
        </SheetHeader>

        {/* Messages */}
        <ScrollArea className="flex-1">
          {!isLocalMode ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
              <Bot className="size-10 text-muted-foreground/40" />
              <div className="space-y-1">
                <p className="text-sm font-medium">Local Mode Required</p>
                <p className="text-xs text-muted-foreground">
                  Repo Chat is available only for local repositories. Open a local repo to start chatting.
                </p>
              </div>
            </div>
          ) : (
            <ChatMessages messages={messages} status={status} />
          )}
        </ScrollArea>

        {/* Input */}
        {isLocalMode && (
          <ChatInput
            onSend={handleSend}
            onStop={stop}
            status={status}
          />
        )}

        {/* Footer badge */}
        <div className="flex items-center justify-center border-t px-4 py-2">
          <Badge variant="outline" className="text-[10px] font-normal text-muted-foreground gap-1">
            <Sparkles className="size-2.5" />
            Powered by GPT-4o
          </Badge>
        </div>
      </SheetContent>
    </Sheet>
  );
}
