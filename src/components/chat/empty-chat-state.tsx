"use client";

import { useSession } from "@/lib/auth/auth-client";

export function EmptyChatState() {
  const { data: session } = useSession();
  const firstName = session?.user.name?.split(" ")[0];

  return (
    <div className="flex flex-col items-center gap-8 text-center">
      <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        {firstName ? (
          <p>
            What's on your mind,{" "}
            <span className="font-medium text-foreground">{firstName}</span>?
          </p>
        ) : (
          "What's on the agenda today?"
        )}
      </h2>
    </div>
  );
}
