import { RepoSelector } from "@/components/repo/repo-selector";
import { SiteFooter } from "@/components/shared/site-footer";
import { ModePromo } from "@/components/shared/mode-promo";
import { Suspense } from "react";

export default function HomePage() {
  return (
    <Suspense>
      <RepoSelector />
      <SiteFooter />
      <ModePromo />
    </Suspense>
  );
}
