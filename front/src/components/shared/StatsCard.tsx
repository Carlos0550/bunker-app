import React from "react";
import { LucideIcon } from "lucide-react";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  iconBgColor?: string;
  iconColor?: string;
  valueColor?: string;
  borderColor?: string;
  className?: string;
}

export function StatsCard({
  title,
  value,
  icon: Icon,
  iconBgColor = "bg-primary/20",
  iconColor = "text-primary",
  valueColor = "text-foreground",
  borderColor,
  className = "",
}: StatsCardProps) {
  return (
    <div className={`stat-card ${borderColor ? `border-${borderColor}` : ""} ${className}`}>
      <div className="flex items-center justify-between">
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm text-muted-foreground truncate">{title}</p>
          <p className={`text-xl sm:text-2xl font-bold ${valueColor}`}>{value}</p>
        </div>
        <div className={`p-2 sm:p-3 rounded-xl ${iconBgColor} shrink-0`}>
          <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${iconColor}`} />
        </div>
      </div>
    </div>
  );
}

interface StatsGridProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}

export function StatsGrid({ children, columns = 4, className = "" }: StatsGridProps) {
  const gridCols = {
    2: "grid-cols-2",
    3: "grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-2 lg:grid-cols-4",
  };

  return (
    <div className={`grid ${gridCols[columns]} gap-3 sm:gap-4 ${className}`}>
      {children}
    </div>
  );
}
