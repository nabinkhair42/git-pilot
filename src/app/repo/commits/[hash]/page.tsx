"use client";

import { use } from "react";
import { CommitDetail } from "@/components/commits/commit-detail";

export default function CommitDetailPage({
  params,
}: {
  params: Promise<{ hash: string }>;
}) {
  const { hash } = use(params);

  return <CommitDetail hash={hash} />;
}
