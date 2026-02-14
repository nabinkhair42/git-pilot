"use client";

import type { ChatStatus } from "ai";
import type { MentionItem } from "@/lib/mentions/types";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputHeader,
  PromptInputFooter,
  PromptInputTools,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input";
import {
  ModelSelector,
  ModelSelectorTrigger,
  ModelSelectorContent,
  ModelSelectorInput,
  ModelSelectorList,
  ModelSelectorEmpty,
  ModelSelectorGroup,
  ModelSelectorItem,
  ModelSelectorLogo,
  ModelSelectorName,
} from "@/components/ai-elements/model-selector";
import { MentionChips } from "@/components/chat/mention-chips";
import { MentionPicker } from "@/components/chat/mention-picker";
import { useMentions } from "@/hooks/use-mentions";
import { Button } from "@/components/ui/button";
import { AtSign, Infinity } from "lucide-react";
import { useState, useCallback, type KeyboardEvent } from "react";

const MODELS = [
  { id: "gpt-4o", name: "GPT-4o", provider: "openai" as const },
  {
    id: "claude-sonnet-4-5-20250929",
    name: "Claude Sonnet 4.5",
    provider: "anthropic" as const,
  },
  {
    id: "claude-opus-4-6",
    name: "Claude Opus 4.6",
    provider: "anthropic" as const,
  },
  { id: "grok-3", name: "Grok 3", provider: "xai" as const },
];

interface ChatInputProps {
  onSend: (text: string, mentions: MentionItem[]) => void;
  onStop: () => void;
  status: ChatStatus;
  disabled?: boolean;
}

export function ChatInput({
  onSend,
  onStop,
  status,
  disabled,
}: ChatInputProps) {
  const [selectedModel, setSelectedModel] = useState(MODELS[0].id);
  const [modelSelectorOpen, setModelSelectorOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

  const { mentions, toggleMention, removeMention, clearMentions } = useMentions();

  const currentModel = MODELS.find((m) => m.id === selectedModel) ?? MODELS[0];

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "@") {
        const textarea = e.currentTarget;
        const pos = textarea.selectionStart;
        const text = textarea.value;
        // Open picker when @ is typed at start or after whitespace
        if (pos === 0 || /\s/.test(text[pos - 1] || "")) {
          e.preventDefault();
          setPickerOpen(true);
        }
      }
      // Close picker on Escape
      if (e.key === "Escape" && pickerOpen) {
        e.preventDefault();
        setPickerOpen(false);
      }
    },
    [pickerOpen]
  );

  const handlePickerConfirm = useCallback(() => {
    // Mentions are already added via toggleMention, just close
  }, []);

  return (
    <div className="relative shrink-0">
      <MentionPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        selectedMentions={mentions}
        onToggle={toggleMention}
        onConfirm={handlePickerConfirm}
      />

      <PromptInput
        onSubmit={(message) => {
          if (message.text.trim() || mentions.length > 0) {
            onSend(message.text.trim(), mentions);
            clearMentions();
          }
        }}
      >
        <PromptInputHeader>
          <MentionChips mentions={mentions} onRemove={removeMention} />
        </PromptInputHeader>

        <PromptInputTextarea
          placeholder="Ask questions about the repo"
          disabled={disabled}
          className="min-h-10"
          onKeyDown={handleKeyDown}
        />
        <PromptInputFooter>
          <PromptInputTools>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 px-2 text-xs text-muted-foreground"
              type="button"
              onClick={() => setPickerOpen((prev) => !prev)}
              title="Reference repo entities (@)"
            >
              <AtSign className="size-3.5" />
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 px-2 text-xs text-muted-foreground"
              type="button"
            >
              <Infinity className="size-3.5" />
              Agent
            </Button>

            <ModelSelector
              open={modelSelectorOpen}
              onOpenChange={setModelSelectorOpen}
            >
              <ModelSelectorTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1.5 px-2 text-xs"
                  type="button"
                >
                  <ModelSelectorLogo provider={currentModel.provider} />
                  {currentModel.name}
                </Button>
              </ModelSelectorTrigger>
              <ModelSelectorContent>
                <ModelSelectorInput placeholder="Search models..." />
                <ModelSelectorList>
                  <ModelSelectorEmpty>No models found.</ModelSelectorEmpty>
                  <ModelSelectorGroup>
                    {MODELS.map((model) => (
                      <ModelSelectorItem
                        key={model.id}
                        value={model.id}
                        onSelect={() => {
                          setSelectedModel(model.id);
                          setModelSelectorOpen(false);
                        }}
                      >
                        <ModelSelectorLogo provider={model.provider} />
                        <ModelSelectorName>{model.name}</ModelSelectorName>
                      </ModelSelectorItem>
                    ))}
                  </ModelSelectorGroup>
                </ModelSelectorList>
              </ModelSelectorContent>
            </ModelSelector>
          </PromptInputTools>

          <PromptInputSubmit
            status={status}
            onStop={onStop}
            disabled={disabled}
          />
        </PromptInputFooter>
      </PromptInput>
    </div>
  );
}
