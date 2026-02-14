import { ChatSidebar } from "@/components/chat/chat-sidebar";
import { RepoSelector } from "@/components/repo/repo-selector";
import { ModePromo } from "@/components/shared/mode-promo";
import { SiteFooter } from "@/components/shared/site-footer";
import { Suspense } from "react";

export default function HomePage() {
  return (
    <div className="flex min-h-0 flex-1 overflow-clip">
      <div className="flex min-w-0 flex-1 flex-col overflow-y-auto page-rails">
        <Suspense>
          <RepoSelector />
          <ModePromo />
        </Suspense>
        <div className="mt-auto">
          <SiteFooter />
        </div>
      </div>
      <ChatSidebar />
    </div>
  );
}
