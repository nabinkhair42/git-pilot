"use client";

import { type UIMessage, isToolUIPart, getToolName } from "ai";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  Tool,
  ToolHeader,
  ToolContent,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool";
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Suggestion } from "@/components/ai-elements/suggestion";
import { Spinner } from "@/components/ui/spinner";
import { GitManagerAppIcon } from "@/components/icons/git-manager";

const TOOL_LABELS: Record<string, string> = {
  getRepoOverview: "Repository Overview",
  getCommitHistory: "Commit History",
  getCommitDetails: "Commit Details",
  listBranches: "List Branches",
  compareDiff: "Compare Diff",
  listTags: "List Tags",
  getFileContent: "File Content",
  listFiles: "File Tree",
  createBranch: "Create Branch",
  deleteBranch: "Delete Branch",
  cherryPickCommits: "Cherry Pick",
  revertCommits: "Revert Commits",
  resetBranch: "Reset Branch",
};

interface ChatMessagesProps {
  messages: UIMessage[];
  status: string;
  onSuggestionClick?: (suggestion: string) => void;
}

export function ChatMessages({ messages, status, onSuggestionClick }: ChatMessagesProps) {
  if (messages.length === 0) {
    return (
      <ConversationEmptyState>
        <div className="flex flex-col items-center gap-3 p-8 text-center">
          <div className="text-muted-foreground">
            <GitManagerAppIcon className="size-12" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-medium">Chat with your Repo</h3>
            <p className="text-sm text-muted-foreground">
              Ask me anything about your repository — commits, branches, diffs, file history, and more.
            </p>
          </div>
          <div className="mt-2 flex flex-wrap justify-center gap-2">
            {[
              "Summarize recent commits",
              "What branches exist?",
              "What files changed recently?",
              "Compare main vs HEAD",
            ].map((s) => (
              <Suggestion
                key={s}
                suggestion={s}
                onClick={onSuggestionClick}
              />
            ))}
          </div>
        </div>
      </ConversationEmptyState>
    );
  }

  return (
    <Conversation>
      <ConversationContent>
        {messages.map((message) => (
          <Message key={message.id} from={message.role}>
            <MessageContent>
              {message.parts.map((part, index) => {
                if (part.type === "text" && part.text.trim()) {
                  if (message.role === "user") {
                    // Strip the mention context block from display
                    const displayText = part.text.replace(/\n\n---\n\n## User-Referenced Context[\s\S]*$/, "").trim();
                    if (!displayText) return null;
                    return <p key={index} className="whitespace-pre-wrap">{displayText}</p>;
                  }
                  return <MessageResponse key={index}>{part.text}</MessageResponse>;
                }

                if (isToolUIPart(part)) {
                  const name = getToolName(part);
                  const label = TOOL_LABELS[name] ?? name;
                  const isDynamic = part.type === "dynamic-tool";

                  return (
                    <Tool key={part.toolCallId}>
                      <ToolHeader
                        title={label}
                        state={part.state}
                        {...(isDynamic
                          ? { type: "dynamic-tool" as const, toolName: name }
                          : { type: part.type as `tool-${string}` })}
                      />
                      <ToolContent>
                        <ToolInput input={part.input} />
                        {part.state === "output-available" ? (
                          <ToolOutput output={part.output} errorText={undefined} />
                        ) : null}
                        {part.state === "output-error" ? (
                          <ToolOutput output={undefined} errorText={part.errorText} />
                        ) : null}
                      </ToolContent>
                    </Tool>
                  );
                }

                if (part.type === "reasoning" && "text" in part) {
                  return (
                    <div
                      key={index}
                      className="rounded-md border border-dashed border-muted-foreground/20 px-3 py-2 text-xs italic text-muted-foreground"
                    >
                      {part.text}
                    </div>
                  );
                }

                return null;
              })}
            </MessageContent>
          </Message>
        ))}

        {/* Thinking indicator */}
        {status === "submitted" ? (
          <Message from="assistant">
            <MessageContent>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Spinner className="size-4" />
                <span>Thinking...</span>
              </div>
            </MessageContent>
          </Message>
        ) : null}
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  );
}
