import React from "react";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  /**
   * The icon to display (from lucide-react)
   */
  icon: LucideIcon;

  /**
   * Main heading text
   */
  title: string;

  /**
   * Descriptive text below the title
   */
  description: string;

  /**
   * Optional action button configuration
   */
  action?: {
    label: string;
    onClick: () => void;
    variant?:
      | "default"
      | "outline"
      | "secondary"
      | "destructive"
      | "ghost"
      | "link";
    icon?: LucideIcon;
  };

  /**
   * Additional CSS classes for the container
   */
  className?: string;

  /**
   * Size variant for the empty state
   */
  size?: "sm" | "md" | "lg";
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  size = "md",
}: EmptyStateProps) {
  const sizeClasses = {
    sm: {
      container: "py-8",
      icon: "h-8 w-8 mb-3",
      title: "text-base font-medium mb-1",
      description: "text-sm",
      spacing: "mb-3",
    },
    md: {
      container: "py-12",
      icon: "h-12 w-12 mb-4",
      title: "text-lg font-medium mb-2",
      description: "text-sm",
      spacing: "mb-4",
    },
    lg: {
      container: "py-16",
      icon: "h-16 w-16 mb-6",
      title: "text-xl font-medium mb-3",
      description: "text-base",
      spacing: "mb-6",
    },
  };

  const classes = sizeClasses[size];

  return (
    <div className={cn("text-center", classes.container, className)}>
      <Icon className={cn("mx-auto text-muted-foreground", classes.icon)} />

      <h3 className={cn("text-foreground", classes.title)}>{title}</h3>

      <p
        className={cn(
          "text-muted-foreground max-w-md mx-auto",
          classes.description,
          action && classes.spacing,
        )}
      >
        {description}
      </p>

      {action && (
        <Button
          onClick={action.onClick}
          variant={action.variant || "default"}
          className="mt-4"
        >
          {action.icon && <action.icon className="h-4 w-4 mr-2" />}
          {action.label}
        </Button>
      )}
    </div>
  );
}

// Preset variants for common use cases
export function NoDataEmptyState({
  title = "No Data Available",
  description = "There's nothing to show here yet.",
  className,
}: {
  title?: string;
  description?: string;
  className?: string;
}) {
  const { Inbox } = require("lucide-react");

  return (
    <EmptyState
      icon={Inbox}
      title={title}
      description={description}
      className={className}
      size="md"
    />
  );
}

export function NoResultsEmptyState({
  title = "No Results Found",
  description = "Try adjusting your search or filter criteria.",
  onReset,
  className,
}: {
  title?: string;
  description?: string;
  onReset?: () => void;
  className?: string;
}) {
  const { SearchX, RotateCcw } = require("lucide-react");

  return (
    <EmptyState
      icon={SearchX}
      title={title}
      description={description}
      action={
        onReset
          ? {
              label: "Clear Filters",
              onClick: onReset,
              variant: "outline",
              icon: RotateCcw,
            }
          : undefined
      }
      className={className}
      size="md"
    />
  );
}

export function LoadingEmptyState({
  title = "Loading...",
  description = "Please wait while we fetch your data.",
  className,
}: {
  title?: string;
  description?: string;
  className?: string;
}) {
  const { Loader2 } = require("lucide-react");

  return (
    <div className={cn("text-center py-12", className)}>
      <Loader2 className="h-8 w-8 mx-auto mb-4 text-muted-foreground animate-spin" />
      <h3 className="text-lg font-medium text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

export function ErrorEmptyState({
  title = "Something went wrong",
  description = "We couldn't load the data. Please try again.",
  onRetry,
  className,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}) {
  const { AlertCircle, RefreshCw } = require("lucide-react");

  return (
    <EmptyState
      icon={AlertCircle}
      title={title}
      description={description}
      action={
        onRetry
          ? {
              label: "Try Again",
              onClick: onRetry,
              variant: "outline",
              icon: RefreshCw,
            }
          : undefined
      }
      className={className}
      size="md"
    />
  );
}
