"use client";

import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool";
import { Spinner } from "@/components/ui/spinner";
import { type UIMessage, getToolName, isToolUIPart } from "ai";
import { useMemo } from "react";
import { ApprovalRenderer } from "./tool-renderers/approval-renderer";
import { toolRenderers } from "./tool-renderers/registry";

const TOOL_LABELS: Record<string, string> = {
  getRepoOverview: "Repository Overview",
  getCommitHistory: "Commit History",
  getCommitDetails: "Commit Details",
  listBranches: "List Branches",
  compareDiff: "Compare Diff",
  listTags: "List Tags",
  getFileContent: "File Content",
  listFiles: "File Tree",
  listUserRepos: "List Repositories",
  selectRepository: "Select Repository",
  createBranch: "Create Branch",
  deleteBranch: "Delete Branch",
  cherryPickCommits: "Cherry Pick",
  revertCommits: "Revert Commits",
  resetBranch: "Reset Branch",
  listContributors: "Contributors",
  getUserProfile: "User Profile",
  createRepository: "Create Repository",
  deleteRepository: "Delete Repository",
  createOrUpdateFile: "Create/Update File",
  deleteFile: "Delete File",
  createRelease: "Create Release",
};

interface ChatMessagesProps {
  messages: UIMessage[];
  status: string;
  onSuggestionClick?: (suggestion: string) => void;
  onAction?: (message: string) => void;
  addToolApprovalResponse?: (params: { id: string; approved: boolean }) => void;
}

export function ChatMessages({
  messages: rawMessages,
  status,
  onAction,
  addToolApprovalResponse,
}: ChatMessagesProps) {
  // Deduplicate messages by ID — useChat can produce duplicates when
  // initialMessages overlap with streamed messages. Keep the last occurrence.
  const messages = useMemo(() => {
    const seen = new Set<string>();
    const deduped: UIMessage[] = [];
    for (let i = rawMessages.length - 1; i >= 0; i--) {
      if (!seen.has(rawMessages[i].id)) {
        seen.add(rawMessages[i].id);
        deduped.push(rawMessages[i]);
      }
    }
    return deduped.reverse();
  }, [rawMessages]);

  if (messages.length === 0) {
    return <ConversationEmptyState />;
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
                    const displayText = part.text
                      .replace(
                        /\n\n---\n\n## User-Referenced Context[\s\S]*$/,
                        "",
                      )
                      .trim();
                    if (!displayText) return null;
                    return (
                      <p key={index} className="whitespace-pre-wrap">
                        {displayText}
                      </p>
                    );
                  }
                  return (
                    <MessageResponse key={index}>{part.text}</MessageResponse>
                  );
                }

                if (isToolUIPart(part)) {
                  const name = getToolName(part);
                  const label = TOOL_LABELS[name] ?? name;
                  const isDynamic = part.type === "dynamic-tool";

                  return (
                    <Tool key={`${part.toolCallId}-${index}`}>
                      <ToolHeader
                        title={label}
                        state={part.state}
                        {...(isDynamic
                          ? { type: "dynamic-tool" as const, toolName: name }
                          : { type: part.type as `tool-${string}` })}
                      />
                      <ToolContent>
                        <ToolInput input={part.input} />

                        {/* Approval requested — show confirm/deny UI */}
                        {part.state === "approval-requested" &&
                          addToolApprovalResponse && (
                            <ApprovalRenderer
                              toolName={name}
                              input={part.input}
                              onApprove={() =>
                                addToolApprovalResponse({
                                  id: (
                                    part as unknown as {
                                      approval: { id: string };
                                    }
                                  ).approval.id,
                                  approved: true,
                                })
                              }
                              onDeny={() =>
                                addToolApprovalResponse({
                                  id: (
                                    part as unknown as {
                                      approval: { id: string };
                                    }
                                  ).approval.id,
                                  approved: false,
                                })
                              }
                            />
                          )}

                        {/* Denied — show denial message */}
                        {part.state === "output-denied" && (
                          <div className="text-sm text-muted-foreground">
                            Action was denied by user.
                          </div>
                        )}

                        {/* Output available — use rich renderer or JSON fallback */}
                        {part.state === "output-available" &&
                          (() => {
                            const Renderer = toolRenderers[name];
                            if (Renderer) {
                              return (
                                <Renderer
                                  output={part.output}
                                  input={part.input}
                                  onAction={onAction ?? (() => {})}
                                />
                              );
                            }
                            return (
                              <ToolOutput
                                output={part.output}
                                errorText={undefined}
                              />
                            );
                          })()}

                        {/* Error */}
                        {part.state === "output-error" && (
                          <ToolOutput
                            output={undefined}
                            errorText={part.errorText}
                          />
                        )}
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
                <span>Thinking</span>
              </div>
            </MessageContent>
          </Message>
        ) : null}
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  );
}
