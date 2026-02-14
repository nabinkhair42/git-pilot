export type MentionCategory = "file" | "commit" | "branch" | "tag" | "repository"

export interface MentionItem {
  id: string              // "category:value" (e.g., "commit:abc1234")
  category: MentionCategory
  label: string           // Display text in picker/chip
  description?: string    // Secondary text
  value: string           // Raw value for resolution (hash, path, name)
}

export interface ResolvedMentionContext {
  category: MentionCategory
  label: string
  value: string
  content: string         // Fetched context (file content, commit diff, etc.)
}
