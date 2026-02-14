import { cn } from "@/lib/utils";

interface PageLayoutProps {
  label: string;
  title: string;
  actions?: React.ReactNode;
  filters?: React.ReactNode;
  children: React.ReactNode;
}

export function PageLayout({
  label,
  title,
  actions,
  filters,
  children,
}: PageLayoutProps) {
  return (
    <div className="flex min-h-0 flex-1 flex-col py-3">
      {/* Pinned header */}
      <div className="rail-bounded px-4 sm:px-6">
        <div
          className={cn(
            "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
          )}
        >
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {label}
            </p>
            <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
          </div>
          {actions}
        </div>
        {filters}
      </div>
      {/* Scrollable content */}
      <div className="min-h-0 flex-1 overflow-y-auto rail-bounded px-0!">{children}</div>
    </div>
  );
}
