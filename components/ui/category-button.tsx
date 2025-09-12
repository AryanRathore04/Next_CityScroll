"use client"
import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface CategoryButtonProps {
  icon: ReactNode;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
  className?: string;
}

export function CategoryButton({
  icon,
  label,
  isActive = false,
  onClick,
  className,
}: CategoryButtonProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-4 p-6 rounded-lg transition-all duration-300 group",
        "bg-card sophisticated-shadow hover:card-shadow-hover border border-border",
        "hover:scale-[1.02] active:scale-[0.98]",
        isActive && "bg-primary text-primary-foreground border-primary",
        className,
      )}
    >
      <div
        className={cn(
          "p-3 rounded-full transition-all duration-300",
          isActive
            ? "bg-primary-foreground/20 text-primary-foreground"
            : "bg-classic-warm text-foreground group-hover:bg-primary group-hover:text-primary-foreground",
        )}
      >
        {icon}
      </div>
      <span
        className={cn(
          "font-body text-sm",
          isActive
            ? "text-primary-foreground"
            : "text-foreground group-hover:text-primary",
        )}
      >
        {label}
      </span>
    </button>
  );
}
