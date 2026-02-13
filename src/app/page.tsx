import { RepoSelector } from "@/components/repo/repo-selector";
import { Suspense } from "react";

export default function HomePage() {
  return (
    <Suspense>
      <RepoSelector />
    </Suspense>
  );
}
