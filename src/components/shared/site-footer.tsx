"use client";

import Link from "next/link";
import { useTheme } from "next-themes";
import { Sun, Moon, Monitor } from "lucide-react";
import { GitHub } from "../icons/github";
import { GitManagerAppIcon } from "../icons/git-manager";
const themes = [
  { value: "light", icon: Sun, label: "Light" },
  { value: "dark", icon: Moon, label: "Dark" },
  { value: "system", icon: Monitor, label: "System" },
] as const;

export function SiteFooter() {
  const { theme, setTheme } = useTheme();

  return (
    <footer className="border-t border-border">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-6 py-8 sm:flex-row sm:items-center sm:justify-between">
        {/* Left — branding */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 text-foreground">
            <GitManagerAppIcon className="size-5" />
            <span className="text-sm font-semibold tracking-tight">
              Git Commit Manager
            </span>
          </Link>
        </div>

        {/* Right — theme switcher */}
        <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/50 p-1">
          {themes.map(({ value, icon: Icon, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setTheme(value)}
              className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-all ${
                theme === value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              aria-label={`Switch to ${label} theme`}
            >
              <Icon size={13} />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </footer>
  );
}
