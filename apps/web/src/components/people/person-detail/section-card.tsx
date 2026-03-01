import HouseholdTooltip from "@/components/household-tooltip";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../../ui/card";

interface DetailRowProps {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  value: React.ReactNode;
  className?: string;
  /** When true, shows a tooltip indicating the value comes from the household head. */
  isFromHousehold?: boolean;
}

/** Displays a single label–value pair with an optional icon and household-fallback indicator. */
export function DetailRow({
  icon: Icon,
  label,
  value,
  className,
  isFromHousehold,
}: DetailRowProps) {
  return (
    <div className={cn("flex items-start gap-3", className)}>
      {Icon && (
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted/60">
          <Icon className="size-4 text-muted-foreground" />
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-wrap items-baseline gap-x-3 gap-y-0.5">
        <span className="w-32 shrink-0 text-muted-foreground text-xs uppercase tracking-wide">
          <span className="flex items-center gap-1">
            {label}
            <HouseholdTooltip isFromHousehold={!!isFromHousehold} />
          </span>
        </span>
        <span className="min-w-0 flex-1 text-foreground text-sm">
          {value || "—"}
        </span>
      </div>
    </div>
  );
}

interface SectionCardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

/** Card wrapper used to group related detail rows under a titled section. */
export function SectionCard({
  title,
  description,
  children,
}: SectionCardProps) {
  return (
    <Card className="gap-0">
      <CardHeader className="gap-1 border-b">
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="grid gap-3 pt-6">{children}</CardContent>
    </Card>
  );
}
