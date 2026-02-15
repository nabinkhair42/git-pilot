import { db } from "@/lib/db";
import { chat } from "@/lib/db/schema";
import { generateId } from "@/lib/id";
import { getAuthSession } from "@/lib/auth/auth-helpers";
import { successResponse, errorResponse } from "@/lib/response/server-response";
import { desc, eq } from "drizzle-orm";

export async function GET() {
  try {
    const session = await getAuthSession();
    if (!session) return errorResponse("Not authenticated", 401);

    const chats = await db
      .select({
        id: chat.id,
        title: chat.title,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
      })
      .from(chat)
      .where(eq(chat.userId, session.user.id))
      .orderBy(desc(chat.updatedAt));

    return successResponse(chats);
  } catch (error) {
    console.error("[Chats GET]", error);
    return errorResponse("Failed to fetch chats");
  }
}

export async function POST(req: Request) {
  try {
    const session = await getAuthSession();
    if (!session) return errorResponse("Not authenticated", 401);

    const body = await req.json().catch(() => ({}));
    const id = generateId();

    const [created] = await db
      .insert(chat)
      .values({
        id,
        userId: session.user.id,
        title: body.title ?? "New chat",
      })
      .returning();

    return successResponse(created, 201);
  } catch (error) {
    console.error("[Chats POST]", error);
    return errorResponse("Failed to create chat");
  }
}
