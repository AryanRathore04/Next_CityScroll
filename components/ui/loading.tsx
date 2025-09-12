"use client"
import { cn } from "@/lib/utils";

interface LoadingProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  text?: string;
  fullScreen?: boolean;
}

export function Loading({
  size = "md",
  className,
  text,
  fullScreen = false,
}: LoadingProps) {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-10 h-10",
    lg: "w-16 h-16",
  } as const;

  const LoadingSpinner = () => (
    <div className="flex flex-col items-center justify-center gap-4">
      <div className={cn("loading-spinner", sizeClasses[size], className)} />
      {text && (
        <p className="text-muted-foreground font-body text-sm animate-pulse-gentle">
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return <LoadingSpinner />;
}

export function PageLoading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loading size="lg" text="Loading..." />
    </div>
  );
}
