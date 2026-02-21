"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { CATEGORY_ICONS } from "@/lib/mentions/icons";
import type { MentionCategory } from "@/lib/mentions/types";

const MENTION_REGEX = /@(file|commit|branch|tag|repo):(\S+)/g;

const CATEGORY_MAP: Record<string, MentionCategory> = {
  file: "file",
  commit: "commit",
  branch: "branch",
  tag: "tag",
  repo: "repository",
};

interface Segment {
  type: "text" | "mention";
  value: string;
  category?: MentionCategory;
  label?: string;
}

function parseSegments(text: string): Segment[] {
  const segments: Segment[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(MENTION_REGEX)) {
    const start = match.index!;
    if (start > lastIndex) {
      segments.push({ type: "text", value: text.slice(lastIndex, start) });
    }
    const shortcut = match[1];
    const label = match[2];
    segments.push({
      type: "mention",
      value: match[0],
      category: CATEGORY_MAP[shortcut],
      label,
    });
    lastIndex = start + match[0].length;
  }

  if (lastIndex < text.length) {
    segments.push({ type: "text", value: text.slice(lastIndex) });
  }

  return segments;
}

interface EnrichedTextProps {
  text: string;
}

export function EnrichedText({ text }: EnrichedTextProps) {
  const segments = useMemo(() => parseSegments(text), [text]);

  // Fast path: no mentions found
  if (segments.length === 1 && segments[0].type === "text") {
    return <p className="whitespace-pre-wrap">{text}</p>;
  }

  return (
    <p className="whitespace-pre-wrap">
      {segments.map((seg, i) => {
        if (seg.type === "text") {
          return <span key={i}>{seg.value}</span>;
        }

        const Icon = seg.category ? CATEGORY_ICONS[seg.category] : null;

        return (
          <Badge
            key={i}
            variant="secondary"
            className="mx-0.5 inline-flex max-w-32 align-baseline text-xs"
          >
            {Icon && <Icon className="size-3 shrink-0" />}
            <span className="truncate">{seg.label}</span>
          </Badge>
        );
      })}
    </p>
  );
}
