import { db } from "@/lib/db";
import { chat, chatMessage } from "@/lib/db/schema";
import { getAuthSession } from "@/lib/auth/auth-helpers";
import { successResponse, errorResponse } from "@/lib/response/server-response";
import { eq, and } from "drizzle-orm";
import type { UIMessage } from "ai";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session) return errorResponse("Not authenticated", 401);

    const { chatId } = await params;

    // Verify ownership
    const [found] = await db
      .select({ id: chat.id })
      .from(chat)
      .where(and(eq(chat.id, chatId), eq(chat.userId, session.user.id)));

    if (!found) return errorResponse("Chat not found", 404);

    const { messages }: { messages: UIMessage[] } = await req.json();

    if (messages.length > 0) {
      await db
        .insert(chatMessage)
        .values(
          messages.map((m) => ({
            id: m.id,
            chatId,
            role: m.role,
            parts: m.parts,
          }))
        )
        .onConflictDoUpdate({
          target: chatMessage.id,
          set: {
            parts: chatMessage.parts,
          },
        });

      // Bump updatedAt
      await db
        .update(chat)
        .set({ updatedAt: new Date() })
        .where(eq(chat.id, chatId));
    }

    return successResponse({ saved: messages.length });
  } catch (error) {
    console.error("[Messages POST]", error);
    return errorResponse("Failed to save messages");
  }
}
