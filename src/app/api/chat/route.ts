import { convertToModelMessages, streamText, UIMessage, stepCountIs } from "ai";
import { createGitHubTools, createGeneralTools } from "@/lib/ai/github-tools";
import { getModelInstance, validateModelKey, getCheapModel } from "@/lib/ai/models";
import { buildGitHubSystemPrompt, buildGeneralSystemPrompt } from "@/lib/ai/system-prompt";
import { getGitHubToken } from "@/lib/auth/auth-helpers";
import { errorResponse } from "@/lib/response/server-response";

export const maxDuration = 60;

interface ChatRequestBody {
  messages: UIMessage[];
  owner?: string;
  repo?: string;
  model?: string;
}

/**
 * Extract owner/repo from the conversation history. Checks (most recent first):
 * 1. selectRepository tool calls in assistant messages
 * 2. @repo mentions in user messages ("## User-Referenced Context" blocks)
 */
function extractRepoFromHistory(
  messages: UIMessage[],
): { owner: string; repo: string } | null {
  for (let i = messages.length - 1; i >= 0; i--) {
    const msg = messages[i];

    // Check assistant messages for selectRepository tool calls
    if (msg.role === "assistant") {
      for (const part of msg.parts) {
        const p = part as Record<string, unknown>;
        if (
          typeof p.type === "string" &&
          p.type === "tool-selectRepository" &&
          p.state === "output-available"
        ) {
          // Saved parts use "input" (not "args") for tool arguments
          const input = (p.input ?? p.args) as Record<string, string> | undefined;
          if (input?.owner && input?.repo) {
            return { owner: input.owner, repo: input.repo };
          }
        }
      }
    }

    // Check user messages for @repo mention context
    if (msg.role === "user") {
      for (const part of msg.parts) {
        if (part.type !== "text") continue;
        const match = part.text.match(/Repository:\s*([^/\s]+)\/(\S+)/);
        if (match) return { owner: match[1], repo: match[2] };
      }
    }
  }
  return null;
}

export async function POST(req: Request) {
  try {
    const { messages, owner: bodyOwner, repo: bodyRepo, model }: ChatRequestBody = await req.json();

    // Validate API key for the selected model's provider
    if (model) {
      const keyError = validateModelKey(model);
      if (keyError) return errorResponse(keyError);
    }

    // Use body owner/repo first, fall back to extracting from @repo mentions
    let owner = bodyOwner;
    let repo = bodyRepo;
    if (!owner || !repo) {
      const mentioned = extractRepoFromHistory(messages);
      if (mentioned) {
        owner = mentioned.owner;
        repo = mentioned.repo;
      }
    }

    // async-parallel: token fetch and message conversion are independent
    const [token, convertedMessages] = await Promise.all([
      getGitHubToken(),
      convertToModelMessages(messages),
    ]);

    const tools = owner && repo
      ? createGitHubTools(owner, repo, token)
      : createGeneralTools(token);

    const systemPrompt = owner && repo
      ? buildGitHubSystemPrompt(owner, repo)
      : buildGeneralSystemPrompt();

    const result = streamText({
      model: model ? getModelInstance(model) : getCheapModel(),
      system: systemPrompt,
      messages: convertedMessages,
      tools,
      stopWhen: stepCountIs(8),
      onStepFinish({ toolCalls, finishReason }) {
        if (toolCalls.length > 0) {
          console.log(
            `[Chat] Step finished: ${toolCalls.length} tool call(s), reason: ${finishReason}`
          );
        }
      },
    });

    return result.toUIMessageStreamResponse({
      sendReasoning: true,
      onError: (error) => {
        if (error == null) return "An unknown error occurred.";
        if (typeof error === "string") return error;
        if (error instanceof Error) return error.message;
        return JSON.stringify(error);
      },
    });
  } catch (error) {
    console.error("[Chat API Error]", error);
    return errorResponse(
      error instanceof Error ? error.message : "Internal server error"
    );
  }
}
