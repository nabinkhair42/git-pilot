"use client";

import { Suggestion } from "@/components/ai-elements/suggestion";
import { useSession } from "@/lib/auth/auth-client";

const SUGGESTIONS = [
  "Summarize recent commits",
  "What branches exist?",
  "What files changed recently?",
  "Compare main vs HEAD",
];

interface EmptyChatStateProps {
  onSuggestionClick?: (suggestion: string) => void;
}

export function EmptyChatState({ onSuggestionClick }: EmptyChatStateProps) {
  const { data: session } = useSession();
  const firstName = session?.user.name?.split(" ")[0];

  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">
        {firstName ? `What's on the agenda, ${firstName}?` : "What's on the agenda today?"}
      </h2>
      <div className="flex flex-wrap justify-center gap-2">
        {SUGGESTIONS.map((s) => (
          <Suggestion key={s} suggestion={s} onClick={onSuggestionClick} />
        ))}
      </div>
    </div>
  );
}
