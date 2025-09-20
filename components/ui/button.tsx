"use client";
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:scale-[1.02] active:scale-[0.98]",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:bg-primary/90 airbnb-shadow hover:airbnb-shadow-hover font-semibold",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90 airbnb-shadow hover:airbnb-shadow-hover font-semibold",
        outline:
          "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 hover:border-gray-400 airbnb-shadow-sm font-semibold",
        secondary:
          "bg-gray-100 text-gray-700 hover:bg-gray-200 airbnb-shadow-sm font-semibold",
        ghost: "text-gray-700 hover:bg-gray-100 font-medium",
        link: "text-primary underline-offset-4 hover:underline font-medium",
        coral:
          "bg-coral-500 text-white hover:bg-coral-600 airbnb-shadow hover:airbnb-shadow-hover font-semibold",
        // Alias for semantic naming going forward
        brand:
          "bg-coral-500 text-white hover:bg-coral-600 airbnb-shadow hover:airbnb-shadow-hover font-semibold",
      },
      size: {
        default: "h-12 px-6 py-3 text-base",
        sm: "h-10 px-4 py-2 text-sm",
        lg: "h-14 px-8 py-4 text-lg",
        xl: "h-16 px-10 py-5 text-xl",
        icon: "h-12 w-12",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
