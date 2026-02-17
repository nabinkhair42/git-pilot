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
import { Tool, ToolContent, ToolHeader, ToolOutput } from "@/components/ai-elements/tool";
import {
  Confirmation,
  ConfirmationRequest,
  ConfirmationAccepted,
  ConfirmationRejected,
  ConfirmationActions,
  ConfirmationAction,
} from "@/components/ai-elements/confirmation";
import { Spinner } from "@/components/ui/spinner";
import { type UIMessage, type ToolUIPart, getToolName, isToolUIPart } from "ai";
import { CheckIcon, XIcon } from "lucide-react";
import { useMemo } from "react";
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
  mergeBranch: "Merge Branch",
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
  listPullRequests: "Pull Requests",
  getPullRequestDetail: "PR Details",
  createPullRequest: "Create Pull Request",
  mergePullRequest: "Merge Pull Request",
};

const APPROVAL_DESCRIPTIONS: Record<string, (input: Record<string, unknown>) => string> = {
  deleteBranch: (i) => `Permanently delete branch "${i.branch}".`,
  mergeBranch: (i) => `Merge "${i.head}" into "${i.base}".`,
  cherryPickCommits: (i) => `Cherry-pick ${String(i.hash).slice(0, 7)} onto "${i.branch}".`,
  revertCommits: (i) => `Revert ${String(i.hash).slice(0, 7)} on "${i.branch}".`,
  resetBranch: (i) => `Force-reset "${i.branch}" to ${String(i.sha).slice(0, 7)}. Commits after this will be lost.`,
  createRepository: (i) => `Create ${i.isPrivate ? "private" : "public"} repository "${i.name}".`,
  deleteRepository: (i) => `PERMANENTLY delete "${i.owner}/${i.repo}".`,
  createOrUpdateFile: (i) => `${i.sha ? "Update" : "Create"} "${i.path}" on ${i.branch || "default branch"}.`,
  deleteFile: (i) => `Delete "${i.path}" from ${i.branch || "default branch"}.`,
  createRelease: (i) => `Create release "${i.tagName}".`,
  createPullRequest: (i) => `Create PR "${i.title}" from "${i.head}" to "${i.base}".`,
  mergePullRequest: (i) => `Merge PR #${i.pullNumber} (${i.mergeMethod || "merge"}).`,
};

function getApprovalDescription(toolName: string, input: unknown): string {
  const fn = APPROVAL_DESCRIPTIONS[toolName];
  return fn ? fn((input ?? {}) as Record<string, unknown>) : "This action requires your approval.";
}

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

  if (messages.length === 0) return <ConversationEmptyState />;

  return (
    <Conversation>
      <ConversationContent>
        {messages.map((message) => (
          <Message key={message.id} from={message.role}>
            <MessageContent>
              {message.parts.map((part, i) => {
                if (part.type === "text" && part.text.trim()) {
                  if (message.role === "user") {
                    const text = part.text.replace(/\n\n---\n\n## User-Referenced Context[\s\S]*$/, "").trim();
                    return text ? <p key={i} className="whitespace-pre-wrap">{text}</p> : null;
                  }
                  return <MessageResponse key={i}>{part.text}</MessageResponse>;
                }

                if (isToolUIPart(part)) {
                  const name = getToolName(part);
                  const toolPart = part as unknown as ToolUIPart;
                  const Renderer = toolRenderers[name];

                  return (
                    <Tool key={part.toolCallId} defaultOpen={part.state === "approval-requested"}>
                      <ToolHeader
                        title={TOOL_LABELS[name] ?? name}
                        state={part.state}
                        {...(part.type === "dynamic-tool"
                          ? { type: "dynamic-tool" as const, toolName: name }
                          : { type: part.type as `tool-${string}` })}
                      />
                      <ToolContent>
                        {toolPart.approval && addToolApprovalResponse && (
                          <Confirmation approval={toolPart.approval} state={part.state}>
                            <ConfirmationRequest>
                              {getApprovalDescription(name, part.input)}
                            </ConfirmationRequest>
                            <ConfirmationAccepted>
                              <CheckIcon className="size-4" /> Approved
                            </ConfirmationAccepted>
                            <ConfirmationRejected>
                              <XIcon className="size-4" /> Denied
                            </ConfirmationRejected>
                            <ConfirmationActions>
                              <ConfirmationAction
                                variant="outline"
                                onClick={() => addToolApprovalResponse({ id: toolPart.approval!.id, approved: false })}
                              >
                                Deny
                              </ConfirmationAction>
                              <ConfirmationAction
                                onClick={() => addToolApprovalResponse({ id: toolPart.approval!.id, approved: true })}
                              >
                                Approve
                              </ConfirmationAction>
                            </ConfirmationActions>
                          </Confirmation>
                        )}

                        {part.state === "output-available" && (
                          Renderer
                            ? <Renderer output={part.output} input={part.input} onAction={onAction ?? (() => {})} />
                            : <ToolOutput output={part.output} errorText={undefined} />
                        )}

                        {part.state === "output-error" && (
                          <ToolOutput output={undefined} errorText={part.errorText} />
                        )}
                      </ToolContent>
                    </Tool>
                  );
                }

                if (part.type === "reasoning" && "text" in part) {
                  return (
                    <pre key={i} className="rounded-md border border-dashed border-muted-foreground/20 px-3 py-2 text-xs italic text-muted-foreground">
                      {part.text}
                    </pre>
                  );
                }

                return null;
              })}
            </MessageContent>
          </Message>
        ))}

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
