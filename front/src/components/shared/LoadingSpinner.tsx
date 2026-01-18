import React from "react";
import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "w-4 h-4",
  md: "w-6 h-6",
  lg: "w-8 h-8",
};

export function LoadingSpinner({ size = "md", className = "" }: LoadingSpinnerProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Loader2 className={`${sizeClasses[size]} animate-spin text-primary`} />
    </div>
  );
}

interface LoadingContainerProps {
  children?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function LoadingContainer({ children, size = "md", className = "p-8 sm:p-12" }: LoadingContainerProps) {
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <LoadingSpinner size={size} />
      {children && <span className="ml-2 text-muted-foreground">{children}</span>}
    </div>
  );
}
