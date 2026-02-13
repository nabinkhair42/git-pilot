import { convertToModelMessages, streamText, UIMessage, stepCountIs } from "ai";
import { openai } from "@ai-sdk/openai";
import { createGitTools } from "@/lib/ai/tools";
import { buildSystemPrompt } from "@/lib/ai/system-prompt";
import { validateRepo, isLocalModeAllowed } from "@/lib/git";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    if (!isLocalModeAllowed()) {
      return new Response(
        JSON.stringify({ error: "Chat is only available in local mode" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "OpenAI API key not configured. Set OPENAI_API_KEY in your environment." }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const { messages, repoPath }: { messages: UIMessage[]; repoPath: string } =
      await req.json();

    if (!repoPath) {
      return new Response(
        JSON.stringify({ error: "Missing repoPath" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const isValid = await validateRepo(repoPath);
    if (!isValid) {
      return new Response(
        JSON.stringify({ error: "Invalid git repository path" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const tools = createGitTools(repoPath);
    const systemPrompt = buildSystemPrompt(repoPath);

    const result = streamText({
      model: openai("gpt-4o"),
      system: systemPrompt,
      messages: await convertToModelMessages(messages),
      tools,
      stopWhen: stepCountIs(8),
      onStepFinish({ toolCalls, toolResults, finishReason }) {
        // Optional: log tool usage for debugging
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
