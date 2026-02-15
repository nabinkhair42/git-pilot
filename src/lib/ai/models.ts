import type { LanguageModel } from "ai";
import { openai } from "@ai-sdk/openai";
import { google } from "@ai-sdk/google";
import { anthropic } from "@ai-sdk/anthropic";
import { xai } from "@ai-sdk/xai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { perplexity } from "@ai-sdk/perplexity";
import { AI_MODELS } from "@/config/constants";

const lmstudio = createOpenAICompatible({
  name: "lmstudio",
  baseURL: process.env.LMSTUDIO_BASE_URL || "http://localhost:1234/v1",
});

// ─── Provider registry ──────────────────────────────────────────────────────

const PROVIDERS: Record<string, {
  create: (id: string) => LanguageModel;
  env: string;
  label: string;
}> = {
  openai: { create: (id) => openai(id), env: "OPENAI_API_KEY", label: "OpenAI" },
  google: { create: (id) => google(id), env: "GOOGLE_GENERATIVE_AI_API_KEY", label: "Google Generative AI" },
  anthropic: { create: (id) => anthropic(id), env: "ANTHROPIC_API_KEY", label: "Anthropic" },
  xai: { create: (id) => xai(id), env: "XAI_API_KEY", label: "xAI" },
  lmstudio: { create: () => lmstudio("lm-studio"), env: "LMSTUDIO_BASE_URL", label: "LM Studio" },
  perplexity: { create: (id) => perplexity(id), env: "PERPLEXITY_API_KEY", label: "Perplexity" },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Resolve a model ID (from AI_MODELS) to an AI SDK LanguageModel instance. */
export function getModelInstance(modelId: string): LanguageModel {
  const entry = AI_MODELS.find((m) => m.id === modelId);
  const provider = entry ? PROVIDERS[entry.provider] : undefined;
  if (provider) return provider.create(modelId);
  // Fallback: try to infer provider from the first available key
  return openai(modelId);
}

/** Validate that the API key for a model's provider is configured. Returns an error string or null. */
export function validateModelKey(modelId: string): string | null {
  const entry = AI_MODELS.find((m) => m.id === modelId);
  const provider = entry ? PROVIDERS[entry.provider] : undefined;
  if (provider && !process.env[provider.env]) {
    return `${provider.label} API key not configured. Set ${provider.env} in your environment.`;
  }
  return null;
}

/** Pick the first available model for lightweight tasks (e.g. title generation). */
export function getCheapModel(): LanguageModel {
  for (const model of AI_MODELS) {
    const provider = PROVIDERS[model.provider];
    if (provider && process.env[provider.env]) {
      return provider.create(model.id);
    }
  }
  throw new Error("No AI API key configured. Set at least one provider key in your environment.");
}
