import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { RepoSelector } from "@/components/repo/repo-selector";
import { Suspense } from "react";

export default function HomePage() {
  return (
    <div className="flex min-h-0 flex-1 overflow-clip">
      <div className="flex min-w-0 flex-1 flex-col page-rails">
        <Suspense>
          <RepoSelector />
        </Suspense>
      </div>
      <ChatSidebar />
    </div>
  );
}
