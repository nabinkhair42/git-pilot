import { cn } from "@/lib/utils";

interface PageHeaderProps {
  label: string;
  title: string;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}

export function PageHeader({
  label,
  title,
  actions,
  children,
}: PageHeaderProps) {
  return (
    <div className="rail-bounded px-4 sm:px-6">
      <div
        className={cn(
          "py-4",
          actions &&
            "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
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
      {children}
    </div>
  );
}
