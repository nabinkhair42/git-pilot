"use client";

import { useState, useRef, useEffect, type KeyboardEvent } from "react";
import { Button } from "@/components/ui/button";
import { SendHorizonal, Square, CornerDownLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChatInputProps {
  onSend: (text: string) => void;
  onStop: () => void;
  status: string;
  disabled?: boolean;
}

export function ChatInput({ onSend, onStop, status, disabled }: ChatInputProps) {
  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isStreaming = status === "streaming" || status === "submitted";
  const canSend = input.trim().length > 0 && !isStreaming && !disabled;

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
    }
  }, [input]);

  const handleSend = () => {
    if (!canSend) return;
    onSend(input.trim());
    setInput("");
    // Reset height
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="border-t bg-background p-3">
      <div className="flex items-end gap-2 rounded-lg border bg-muted/30 px-3 py-2 focus-within:ring-1 focus-within:ring-ring">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about your repo..."
          disabled={disabled}
          rows={1}
          className={cn(
            "flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground",
            "max-h-[120px] min-h-[20px]",
            disabled && "opacity-50"
          )}
        />
        {isStreaming ? (
          <Button
            size="icon-xs"
            variant="destructive"
            onClick={onStop}
            className="shrink-0"
          >
            <Square className="size-3" />
          </Button>
        ) : (
          <Button
            size="icon-xs"
            variant={canSend ? "default" : "ghost"}
            onClick={handleSend}
            disabled={!canSend}
            className="shrink-0"
          >
            <SendHorizonal className="size-3" />
          </Button>
        )}
      </div>
      <p className="mt-1.5 flex items-center gap-1 text-[10px] text-muted-foreground">
        <CornerDownLeft className="size-2.5" />
        <span>Enter to send, Shift+Enter for new line</span>
      </p>
    </div>
  );
}
