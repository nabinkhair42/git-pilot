import { generateText } from "ai";
import { getModelInstance, getCheapModel } from "@/lib/ai/models";
import { db } from "@/lib/db";
import { chat } from "@/lib/db/schema";
import { getAuthSession } from "@/lib/auth/auth-helpers";
import { successResponse, errorResponse } from "@/lib/response/server-response";
import { eq, and } from "drizzle-orm";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session) return errorResponse("Not authenticated", 401);

    const { chatId } = await params;
    const { firstMessage, model }: { firstMessage: string; model?: string } = await req.json();

    const { text: title } = await generateText({
      model: model ? getModelInstance(model) : getCheapModel(),
      system:
        "Generate a concise chat title (max 50 chars) for a conversation about GitHub repositories. Return ONLY the title, no quotes or punctuation wrapping.",
      prompt: firstMessage,
    });

    const trimmed = title.slice(0, 50).trim();

    const [updated] = await db
      .update(chat)
      .set({ title: trimmed, updatedAt: new Date() })
      .where(and(eq(chat.id, chatId), eq(chat.userId, session.user.id)))
      .returning();

    if (!updated) return errorResponse("Chat not found", 404);

    return successResponse({ title: trimmed });
  } catch (error) {
    console.error("[Generate Title]", error);
    return errorResponse("Failed to generate title");
  }
}
