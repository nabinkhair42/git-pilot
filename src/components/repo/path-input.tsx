"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Folder, FolderGit2 } from "lucide-react";
import { browsePath, type DirSuggestion } from "@/services/frontend/git.services";

interface PathInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (path: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function PathInput({
  value,
  onChange,
  onSubmit,
  disabled,
  placeholder = "/path/to/your/repo",
}: PathInputProps) {
  const [suggestions, setSuggestions] = useState<DirSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);
  const navigatingRef = useRef(false);

  const fetchSuggestions = useCallback(async (partial: string, resetIndex = true) => {
    if (!partial.startsWith("/")) {
      setSuggestions([]);
      setOpen(false);
      return;
    }

    try {
      const result = await browsePath(partial);
      setSuggestions(result.suggestions);
      setOpen(result.suggestions.length > 0);
      // Only reset activeIndex if user is not currently navigating with keyboard
      if (resetIndex && !navigatingRef.current) {
        setActiveIndex(-1);
      }
    } catch {
      setSuggestions([]);
      setOpen(false);
    }
  }, []);

  function cancelDebounce() {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
  }

  function handleChange(newValue: string) {
    onChange(newValue);
    navigatingRef.current = false;

    cancelDebounce();
    debounceRef.current = setTimeout(() => {
      fetchSuggestions(newValue);
    }, 150);
  }

  function selectSuggestion(suggestion: DirSuggestion) {
    cancelDebounce();
    navigatingRef.current = false;

    if (suggestion.isGitRepo) {
      onChange(suggestion.path);
      setOpen(false);
      setSuggestions([]);
      onSubmit(suggestion.path);
    } else {
      const newPath = suggestion.path + "/";
      onChange(newPath);
      fetchSuggestions(newPath);
      inputRef.current?.focus();
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open || suggestions.length === 0) {
      if (e.key === "Enter") {
        e.preventDefault();
        onSubmit(value);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        cancelDebounce();
        navigatingRef.current = true;
        setActiveIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        cancelDebounce();
        navigatingRef.current = true;
        setActiveIndex((prev) =>
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        navigatingRef.current = false;
        if (activeIndex >= 0 && activeIndex < suggestions.length) {
          selectSuggestion(suggestions[activeIndex]);
        } else {
          setOpen(false);
          onSubmit(value);
        }
        break;
      case "Tab":
        if (activeIndex >= 0 && activeIndex < suggestions.length) {
          e.preventDefault();
          selectSuggestion(suggestions[activeIndex]);
        } else if (suggestions.length === 1) {
          e.preventDefault();
          selectSuggestion(suggestions[0]);
        }
        navigatingRef.current = false;
        break;
      case "Escape":
        setOpen(false);
        navigatingRef.current = false;
        break;
    }
  }

  // Scroll active item into view
  useEffect(() => {
    if (activeIndex < 0 || !listRef.current) return;
    const items = listRef.current.children;
    if (items[activeIndex]) {
      (items[activeIndex] as HTMLElement).scrollIntoView({ block: "nearest" });
    }
  }, [activeIndex]);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={wrapperRef} className="relative flex-1">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (value.startsWith("/") && suggestions.length === 0) {
            fetchSuggestions(value);
          } else if (suggestions.length > 0) {
            setOpen(true);
          }
        }}
        disabled={disabled}
        placeholder={placeholder}
        autoComplete="off"
        spellCheck={false}
        className="h-11 w-full rounded-lg border border-border bg-white/[0.03] px-3 font-mono text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/50 focus:border-primary/40 focus:ring-1 focus:ring-primary/20 disabled:opacity-50"
      />

      {open && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-y-auto rounded-lg border border-border bg-popover shadow-lg">
          <div ref={listRef}>
            {suggestions.map((s, i) => (
              <button
                key={s.path}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectSuggestion(s)}
                className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors ${
                  i === activeIndex
                    ? "bg-white/[0.06] text-foreground"
                    : "text-foreground/80 hover:bg-white/[0.03]"
                } ${i !== 0 ? "border-t border-dashed border-border" : ""}`}
              >
                {s.isGitRepo ? (
                  <FolderGit2 size={14} className="shrink-0 text-green-400" />
                ) : (
                  <Folder size={14} className="shrink-0 text-muted-foreground" />
                )}
                <span className="min-w-0 flex-1 truncate font-mono text-xs">
                  {s.path}
                </span>
                {s.isGitRepo && (
                  <span className="shrink-0 rounded bg-green-500/10 px-1.5 py-0.5 text-[10px] font-medium text-green-400">
                    git
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
