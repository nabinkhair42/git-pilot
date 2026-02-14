import { ChatApp } from "@/components/chat/chat-app";
import { AppSidebar } from "@/components/sidebar/app-sidebar";
import { Suspense } from "react";

export default function HomePage() {
  return (
    <div className="flex h-full w-full">
      <AppSidebar />
      <main className="relative flex min-w-0 flex-1 flex-col">
        <Suspense fallback={null}>
          <ChatApp />
        </Suspense>
      </main>
    </div>
  );
}
