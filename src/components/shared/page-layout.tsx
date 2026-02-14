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
    <div className="flex min-h-0 flex-1 flex-col py-3 rail-bounded">
      {/* Pinned header */}
      <div className="px-4 border-b">
        <div
          className={cn(
            "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
          )}
        >
          <div>
            <p className="font-medium text-muted-foreground">{label}</p>
            <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
          </div>
          {actions}
        </div>
        {filters}
      </div>
      {/* Scrollable content */}
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
