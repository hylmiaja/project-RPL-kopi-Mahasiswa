"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?:    string;
  error?:    string;
  hint?:     string;
  leftIcon?: React.ReactNode;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, leftIcon, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s/g, "-");

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-bold text-amber-900"
          >
            {label}
          </label>
        )}

        <div className="relative">
          {leftIcon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500 pointer-events-none">
              {leftIcon}
            </span>
          )}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              "w-full rounded-xl bg-white border text-amber-900 placeholder:text-amber-300",
              "py-3 pr-4 text-sm transition-all duration-200",
              "focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500",
              leftIcon ? "pl-10" : "pl-4",
              error
                ? "border-red-300 focus:ring-red-400 focus:border-red-400 bg-red-50"
                : "border-amber-200 hover:border-amber-400",
              className
            )}
            {...props}
          />
        </div>

        {error && (
          <p className="text-xs text-red-600 flex items-center gap-1 font-medium">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            {error}
          </p>
        )}

        {hint && !error && (
          <p className="text-xs text-amber-600/70">{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
export { Input };
