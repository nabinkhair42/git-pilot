"use client";

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from "react";

interface ChatNavigationContextValue {
  activeChatId: string | null;
  setActiveChatId: (id: string | null) => void;
  startNewChat: () => void;
}

const ChatNavigationContext = createContext<ChatNavigationContextValue>({
  activeChatId: null,
  setActiveChatId: () => {},
  startNewChat: () => {},
});

export function ChatNavigationProvider({ children }: { children: ReactNode }) {
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

  const startNewChat = useCallback(() => {
    setActiveChatId(null);
  }, []);

  return (
    <ChatNavigationContext.Provider
      value={{ activeChatId, setActiveChatId, startNewChat }}
    >
      {children}
    </ChatNavigationContext.Provider>
  );
}

export function useChatNavigation() {
  return useContext(ChatNavigationContext);
}
