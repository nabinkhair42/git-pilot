import { db } from "@/lib/db";
import { chat, chatMessage } from "@/lib/db/schema";
import { getAuthSession } from "@/lib/auth/auth-helpers";
import { successResponse, errorResponse } from "@/lib/response/server-response";
import { eq, and, asc } from "drizzle-orm";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session) return errorResponse("Not authenticated", 401);

    const { chatId } = await params;

    const [found] = await db
      .select()
      .from(chat)
      .where(and(eq(chat.id, chatId), eq(chat.userId, session.user.id)));

    if (!found) return errorResponse("Chat not found", 404);

    const messages = await db
      .select()
      .from(chatMessage)
      .where(eq(chatMessage.chatId, chatId))
      .orderBy(asc(chatMessage.createdAt));

    return successResponse({ ...found, messages });
  } catch (error) {
    console.error("[Chat GET]", error);
    return errorResponse("Failed to fetch chat");
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session) return errorResponse("Not authenticated", 401);

    const { chatId } = await params;
    const body = await req.json();

    const [updated] = await db
      .update(chat)
      .set({
        ...(body.title !== undefined && { title: body.title }),
        updatedAt: new Date(),
      })
      .where(and(eq(chat.id, chatId), eq(chat.userId, session.user.id)))
      .returning();

    if (!updated) return errorResponse("Chat not found", 404);

    return successResponse(updated);
  } catch (error) {
    console.error("[Chat PATCH]", error);
    return errorResponse("Failed to update chat");
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const session = await getAuthSession();
    if (!session) return errorResponse("Not authenticated", 401);

    const { chatId } = await params;

    const [deleted] = await db
      .delete(chat)
      .where(and(eq(chat.id, chatId), eq(chat.userId, session.user.id)))
      .returning({ id: chat.id });

    if (!deleted) return errorResponse("Chat not found", 404);

    return successResponse({ success: true });
  } catch (error) {
    console.error("[Chat DELETE]", error);
    return errorResponse("Failed to delete chat");
  }
}
