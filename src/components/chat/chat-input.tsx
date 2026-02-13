"use client";

import type { ChatStatus } from "ai";
import {
  PromptInput,
  PromptInputTextarea,
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
import { Button } from "@/components/ui/button";
import { Infinity } from "lucide-react";
import { useState } from "react";

const MODELS = [
  { id: "gpt-4o", name: "GPT-4o", provider: "openai" as const },
  { id: "claude-sonnet-4-5-20250929", name: "Claude Sonnet 4.5", provider: "anthropic" as const },
  { id: "claude-opus-4-6", name: "Claude Opus 4.6", provider: "anthropic" as const },
  { id: "grok-3", name: "Grok 3", provider: "xai" as const },
];

interface ChatInputProps {
  onSend: (text: string) => void;
  onStop: () => void;
  status: ChatStatus;
  disabled?: boolean;
}

export function ChatInput({ onSend, onStop, status, disabled }: ChatInputProps) {
  const [selectedModel, setSelectedModel] = useState(MODELS[0].id);
  const [modelSelectorOpen, setModelSelectorOpen] = useState(false);

  const currentModel = MODELS.find((m) => m.id === selectedModel) ?? MODELS[0];

  return (
    <div className="shrink-0 border-t border-border">
      <PromptInput
        onSubmit={(message) => {
          if (message.text.trim()) {
            onSend(message.text.trim());
          }
        }}
      >
        <PromptInputTextarea
          placeholder="Ask questions about the repo"
          disabled={disabled}
          className="min-h-10"
        />
        <PromptInputFooter>
          <PromptInputTools>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 gap-1.5 px-2 text-xs text-muted-foreground"
              type="button"
            >
              <Infinity className="size-3.5" />
              Agent
            </Button>

            <ModelSelector open={modelSelectorOpen} onOpenChange={setModelSelectorOpen}>
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
