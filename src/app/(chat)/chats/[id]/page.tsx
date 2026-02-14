import { ChatApp } from "@/components/chat/chat-app";

export default async function ChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ChatApp chatId={id} />;
}
