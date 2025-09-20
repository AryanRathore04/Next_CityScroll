"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-12 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-base text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-coral-500 focus:border-coral-500 hover:border-gray-400 transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-50",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
