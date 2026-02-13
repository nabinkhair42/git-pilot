"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { MessageCircle, Sparkles } from "lucide-react";
import { ChatPanel } from "@/components/chat/chat-panel";
import { cn } from "@/lib/utils";

export function ChatTrigger() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            onClick={() => setOpen(true)}
            className={cn(
              "fixed bottom-5 right-5 z-40 size-12 rounded-full shadow-lg",
              "bg-primary text-primary-foreground hover:bg-primary/90",
              "transition-all hover:scale-105 hover:shadow-xl",
              "sm:bottom-6 sm:right-6"
            )}
          >
            <div className="relative">
              <MessageCircle className="size-5" />
            </div>
          </Button>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p>Chat with Repo</p>
        </TooltipContent>
      </Tooltip>

      <ChatPanel open={open} onOpenChange={setOpen} />
    </>
  );
}
