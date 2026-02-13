"use client";

import { useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import ReactMarkdown from "react-markdown";
import type { UIMessage } from "ai";
import {
  Bot,
  User,
  Wrench,
  CheckCircle2,
  AlertCircle,
  Loader2,
  GitCommitHorizontal,
  GitBranch,
  Diff,
  FileText,
  FolderTree,
  Info,
  Tag,
  Archive,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

const TOOL_ICONS: Record<string, React.ElementType> = {
  getRepoOverview: Info,
  getCommitHistory: GitCommitHorizontal,
  getCommitDetails: GitCommitHorizontal,
  listBranches: GitBranch,
  compareDiff: Diff,
  getWorkingTreeStatus: FileText,
  listTags: Tag,
  listStashes: Archive,
  getFileContent: FileText,
  listFiles: FolderTree,
  createNewBranch: GitBranch,
  switchBranch: GitBranch,
  cherryPickCommits: GitCommitHorizontal,
  revertCommits: GitCommitHorizontal,
};

const TOOL_LABELS: Record<string, string> = {
  getRepoOverview: "Checking repo info",
  getCommitHistory: "Searching commits",
  getCommitDetails: "Reading commit details",
  listBranches: "Listing branches",
  compareDiff: "Comparing changes",
  getWorkingTreeStatus: "Checking status",
  listTags: "Listing tags",
  listStashes: "Listing stashes",
  getFileContent: "Reading file",
  listFiles: "Browsing files",
  createNewBranch: "Creating branch",
  switchBranch: "Switching branch",
  cherryPickCommits: "Cherry-picking",
  revertCommits: "Reverting commits",
};

function ToolCallPart({
  toolName,
  state,
}: {
  toolName: string;
  state: string;
}) {
  const Icon = TOOL_ICONS[toolName] ?? Wrench;
  const label = TOOL_LABELS[toolName] ?? toolName;
  const isComplete = state === "output-available";
  const isError = state === "output-error";
  const isRunning = state === "input-available" || state === "input-streaming";

  return (
    <div
      className={cn(
        "my-1 flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs font-medium",
        isComplete && "border-emerald-500/30 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400",
        isError && "border-destructive/30 bg-destructive/5 text-destructive",
        isRunning && "border-blue-500/30 bg-blue-500/5 text-blue-600 dark:text-blue-400"
      )}
    >
      {isRunning ? (
        <Loader2 className="size-3.5 animate-spin" />
      ) : isComplete ? (
        <CheckCircle2 className="size-3.5" />
      ) : isError ? (
        <AlertCircle className="size-3.5" />
      ) : (
        <Icon className="size-3.5" />
      )}
      <span>{label}</span>
      {isRunning && (
        <span className="ml-auto text-[10px] opacity-60">running...</span>
      )}
    </div>
  );
}

interface ChatMessageProps {
  message: UIMessage;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const isUser = message.role === "user";

  return (
    <div
      className={cn(
        "flex gap-3 px-4 py-3",
        isUser && "flex-row-reverse"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-full",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-muted-foreground"
        )}
      >
        {isUser ? <User className="size-3.5" /> : <Bot className="size-3.5" />}
      </div>

      {/* Content */}
      <div
        className={cn(
          "min-w-0 max-w-[85%] space-y-1",
          isUser && "flex flex-col items-end"
        )}
      >
        {message.parts.map((part, index) => {
          if (part.type === "text") {
            if (!part.text.trim()) return null;
            return (
              <div
                key={index}
                className={cn(
                  "rounded-xl px-3.5 py-2.5 text-sm leading-relaxed",
                  isUser
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted/60 text-foreground"
                )}
              >
                {isUser ? (
                  <p className="whitespace-pre-wrap">{part.text}</p>
                ) : (
                  <div className="chat-markdown prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown
                      components={{
                        pre: ({ children }) => (
                          <pre className="overflow-x-auto rounded-md bg-black/5 p-2 text-xs dark:bg-white/5">
                            {children}
                          </pre>
                        ),
                        code: ({ children, className }) => {
                          const isBlock = className?.includes("language-");
                          return isBlock ? (
                            <code className={className}>{children}</code>
                          ) : (
                            <code className="rounded bg-black/5 px-1 py-0.5 text-xs dark:bg-white/10">
                              {children}
                            </code>
                          );
                        },
                        table: ({ children }) => (
                          <div className="overflow-x-auto">
                            <table className="text-xs">{children}</table>
                          </div>
                        ),
                      }}
                    >
                      {part.text}
                    </ReactMarkdown>
                  </div>
                )}
              </div>
            );
          }

          // Handle all tool-* parts generically
          if (part.type.startsWith("tool-") || part.type === "dynamic-tool") {
            const toolPart = part as { type: string; toolName?: string; state: string; toolCallId: string };
            const toolName = toolPart.toolName ?? part.type.replace("tool-", "");
            return (
              <ToolCallPart
                key={toolPart.toolCallId ?? index}
                toolName={toolName}
                state={toolPart.state}
              />
            );
          }

          if (part.type === "reasoning") {
            return (
              <div
                key={index}
                className="rounded-md border border-dashed border-muted-foreground/20 px-3 py-2 text-xs italic text-muted-foreground"
              >
                {(part as { text: string }).text}
              </div>
            );
          }

          return null;
        })}
      </div>
    </div>
  );
}

interface ChatMessagesProps {
  messages: UIMessage[];
  status: string;
}

export function ChatMessages({ messages, status }: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, status]);

  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="flex size-14 items-center justify-center rounded-full bg-primary/10">
          <Bot className="size-7 text-primary" />
        </div>
        <div className="space-y-1.5">
          <h3 className="font-semibold tracking-tight">Chat with your Repo</h3>
          <p className="text-sm text-muted-foreground max-w-[260px]">
            Ask me anything about your repository — commits, branches, diffs, file history, and more.
          </p>
        </div>
        <div className="flex flex-wrap justify-center gap-1.5">
          {[
            "Summarize recent commits",
            "What branches exist?",
            "What files changed recently?",
            "Compare main vs HEAD",
          ].map((suggestion) => (
            <Badge
              key={suggestion}
              variant="outline"
              className="cursor-default text-[11px] font-normal"
            >
              {suggestion}
            </Badge>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {messages.map((message) => (
        <ChatMessage key={message.id} message={message} />
      ))}

      {/* Streaming indicator */}
      {status === "submitted" && (
        <div className="flex items-center gap-2 px-4 py-3 text-xs text-muted-foreground">
          <Loader2 className="size-3.5 animate-spin" />
          <span>Thinking...</span>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
