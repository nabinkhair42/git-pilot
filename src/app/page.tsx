import { RepoSelector } from "@/components/repo/repo-selector";
import { ModePromo } from "@/components/shared/mode-promo";
import { Suspense } from "react";

export default function HomePage() {
  return (
    <Suspense>
      <RepoSelector />
      <ModePromo />
    </Suspense>
  );
}
