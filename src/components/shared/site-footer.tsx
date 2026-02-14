"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useEffect, useState } from "react";
import { GitManagerAppIcon } from "../icons/git-manager";

const themes = [
  { value: "light", icon: Sun, label: "Light" },
  { value: "dark", icon: Moon, label: "Dark" },
  { value: "system", icon: Monitor, label: "System" },
] as const;

export function SiteFooter() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <footer className="shrink-0 border-t border-border page-rails">
      <div className="flex h-10 rail-bounded items-center justify-between gap-4 px-4 sm:px-6">
        {/* Left — branding */}
        <Link
          href="/"
          className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
        >
          <GitManagerAppIcon className="size-4" />
          <span className="text-xs font-medium">GitPilot</span>
        </Link>

        {/* Right — theme switcher */}
        <div className="flex items-center gap-0.5">
          {mounted ?
            themes.map(({ value, icon: Icon, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => setTheme(value)}
                className={`rounded-md p-1.5 transition-colors ${
                  theme === value
                    ? "text-foreground"
                    : "text-muted-foreground/50 hover:text-muted-foreground"
                }`}
                aria-label={`Switch to ${label} theme`}
              >
                <Icon size={14} />
              </button>
            )) : null}
        </div>
      </div>
    </footer>
  );
}
