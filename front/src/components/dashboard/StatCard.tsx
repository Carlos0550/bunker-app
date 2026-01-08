import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: number;
  changeLabel?: string;
  variant?: "default" | "warning" | "success" | "primary";
}

export function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  change, 
  changeLabel,
  variant = "default" 
}: StatCardProps) {
  const iconColors = {
    default: "bg-secondary text-secondary-foreground",
    warning: "bg-warning/20 text-warning",
    success: "bg-success/20 text-success",
    primary: "bg-primary/20 text-primary",
  };

  return (
    <div className="stat-card animate-fade-in">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <p className="text-2xl lg:text-3xl font-bold text-foreground">{value}</p>
          {change !== undefined && (
            <div className="flex items-center gap-1.5">
              <span className={cn(
                "text-xs font-medium",
                change >= 0 ? "text-success" : "text-destructive"
              )}>
                {change >= 0 ? "+" : ""}{change}%
              </span>
              {changeLabel && (
                <span className="text-xs text-muted-foreground">{changeLabel}</span>
              )}
            </div>
          )}
        </div>
        <div className={cn("p-3 rounded-xl", iconColors[variant])}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}
