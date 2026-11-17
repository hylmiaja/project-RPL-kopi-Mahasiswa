"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?:    "sm" | "md" | "lg";
  isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant  = "primary",
      size     = "md",
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const base =
      "inline-flex items-center justify-center gap-2 font-semibold rounded-xl transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#b8860b] focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

    const variants = {
      primary:
        "bg-[#3b2b20] hover:bg-[#2b1d14] active:bg-[#1a120e] text-[#fdfaf6] shadow-elegant hover:shadow-elegant-hover border border-[#5c4033]",
      secondary:
        "glass-premium border border-[#d4bda8] hover:border-[#b8860b] text-[#3b2b20] hover:bg-white/90 shadow-sm",
      ghost:
        "hover:bg-[#f5eee6] text-[#5c4033] hover:text-[#2b1d14]",
      danger:
        "bg-white hover:bg-red-50 text-red-700 border border-red-200 hover:border-red-400",
      outline:
        "border-2 border-[#8b5e34] hover:bg-[#8b5e34] text-[#8b5e34] hover:text-[#fdfaf6] hover:shadow-md",
    };

    const sizes = {
      sm:  "px-4 py-2 text-sm",
      md:  "px-6 py-3 text-sm",
      lg:  "px-8 py-4 text-base",
    };

    return (
      <button
        ref={ref}
        className={cn(base, variants[variant], sizes[size], className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export { Button };
