import { convertToModelMessages, streamText, UIMessage, stepCountIs } from "ai";
import { openai } from "@ai-sdk/openai";
import { createGitHubTools } from "@/lib/ai/github-tools";
import { buildGitHubSystemPrompt } from "@/lib/ai/system-prompt";
import { getGitHubToken } from "@/lib/auth-helpers";

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
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured. Set OPENAI_API_KEY in your environment." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const { messages, owner, repo }: ChatRequestBody = await req.json();

    if (!owner || !repo) {
      return new Response(
        JSON.stringify({ error: "Missing owner or repo" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const token = await getGitHubToken();
    const tools = createGitHubTools(owner, repo, token);
    const systemPrompt = buildGitHubSystemPrompt(owner, repo);

    const result = streamText({
      model: openai("gpt-4o"),
      system: systemPrompt,
      messages: await convertToModelMessages(messages),
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
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
