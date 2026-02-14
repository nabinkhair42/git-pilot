import { convertToModelMessages, streamText, UIMessage, stepCountIs } from "ai";
import { openai } from "@ai-sdk/openai";
import { createGitHubTools } from "@/lib/ai/github-tools";
import { buildGitHubSystemPrompt } from "@/lib/ai/system-prompt";
import { getGitHubToken } from "@/lib/auth-helpers";
import { errorResponse } from "@/lib/response/server-response";

export const maxDuration = 60;

interface ChatRequestBody {
  messages: UIMessage[];
  owner?: string;
  repo?: string;
}

export async function POST(req: Request) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return errorResponse("OpenAI API key not configured. Set OPENAI_API_KEY in your environment.");
    }

    const { messages, owner, repo }: ChatRequestBody = await req.json();

    if (!owner || !repo) {
      return errorResponse("Missing owner or repo", 400);
    }

    // async-parallel: token fetch and message conversion are independent
    const [token, convertedMessages] = await Promise.all([
      getGitHubToken(),
      convertToModelMessages(messages),
    ]);
    const tools = createGitHubTools(owner, repo, token);
    const systemPrompt = buildGitHubSystemPrompt(owner, repo);

    const result = streamText({
      model: openai("gpt-4o"),
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
