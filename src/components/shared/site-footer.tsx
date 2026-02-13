"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";
import { GitManagerAppIcon } from "../icons/git-manager";
import { useEffect, useState } from "react";

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
    <footer className="border-t border-border">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 px-4 py-2 sm:flex-row sm:px-6">

        {/* Left — branding */}
        <Link
          href="/"
          className="flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
        >
          <GitManagerAppIcon className="size-4" />
          <span className="text-xs font-medium">Git Commit Manager</span>
        </Link>

        {/* Right — theme switcher */}
        <div className="flex items-center gap-0.5">
          {mounted &&
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
            ))}
        </div>
      </div>
    </footer>
  );
}
