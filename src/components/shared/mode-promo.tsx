"use client";

import { useState, useEffect } from "react";
import { X, Terminal, Globe, ArrowUpRight } from "lucide-react";
import { useTheme } from "next-themes";
import Image from "next/image";
import { useMode } from "@/hooks/use-mode";

const DISMISSED_KEY_LOCAL = "local-mode-promo-dismissed";
const DISMISSED_KEY_ONLINE = "online-mode-promo-dismissed";

const promoConfig = {
  local: {
    dismissKey: DISMISSED_KEY_LOCAL,
    icon: Terminal,
    title: "Try Local Mode",
    description:
      "Self-host to unlock local Git operations — reset, cherry-pick, stash, and branch management directly from the UI.",
    link: {
      href: "https://github.com/nabinkhair42/git-commit-manager",
      label: "View on GitHub",
    },
    images: {
      dark: "/local-mode-dark.png",
      light: "/local-mode-light.png",
    },
    alt: "Local mode preview",
  },
  online: {
    dismissKey: DISMISSED_KEY_ONLINE,
    icon: Globe,
    title: "Try Online Mode",
    description:
      "Access your GitHub repositories from anywhere — browse commits, branches, tags, and diffs right in the browser.",
    link: {
      href: "https://git.nabinkhair.com.np",
      label: "Open Online",
    },
    images: {
      dark: "/online-mode-dark.png",
      light: "/online-mode-light.png",
    },
    alt: "Online mode preview",
  },
} as const;

export function ModePromo() {
  const { mode } = useMode();
  const promote = mode === "local" ? "online" : "local";
  const config = promoConfig[promote];

  const [visible, setVisible] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const dismissed = localStorage.getItem(config.dismissKey);
    if (!dismissed) {
      const timer = setTimeout(() => setVisible(true), 2500);
      return () => clearTimeout(timer);
    }
  }, [config.dismissKey]);

  function dismiss() {
    setVisible(false);
    localStorage.setItem(config.dismissKey, "true");
  }

  if (!visible) return null;

  const Icon = config.icon;
  const imgSrc =
    resolvedTheme === "dark" ? config.images.dark : config.images.light;

  return (
    <div className="fixed bottom-5 right-5 z-50 w-[340px] animate-in slide-in-from-bottom-4 fade-in duration-300">
      <div className="overflow-hidden rounded-xl border border-border bg-background shadow-lg">
        {/* Screenshot preview */}
        <div className="relative border-b border-border">
          <Image
            src={imgSrc}
            alt={config.alt}
            width={680}
            height={400}
            className="h-auto w-full"
            priority={false}
          />
          <button
            type="button"
            onClick={dismiss}
            className="absolute right-2 top-2 rounded-md bg-background/80 p-1 text-muted-foreground backdrop-blur-sm transition-colors hover:text-foreground"
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>
        </div>

        {/* Content */}
        <div className="px-4 py-3">
          <div className="flex items-center gap-2">
            <Icon size={14} className="shrink-0 text-foreground" />
            <p className="text-sm font-semibold text-foreground">
              {config.title}
            </p>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {config.description}
          </p>
          <div className="mt-3 flex items-center justify-between">
            <a
              href={config.link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-medium text-foreground transition-colors hover:text-foreground/80"
            >
              {config.link.label}
              <ArrowUpRight size={12} />
            </a>
            <button
              type="button"
              onClick={dismiss}
              className="text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
