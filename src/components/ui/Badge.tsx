import { cn } from "@/lib/utils";
import { Role } from "@/lib/constants";
import { ROLE_COLORS, ROLE_LABELS } from "@/lib/constants";

interface BadgeProps {
  className?: string;
  children:   React.ReactNode;
  variant?:   "default" | "success" | "warning" | "danger" | "info" | "dark";
}

export function Badge({ className, children, variant = "default" }: BadgeProps) {
  const variants = {
    default: "bg-gray-100 text-gray-800 border-gray-200",
    success: "bg-green-50 text-green-700 border-green-200",
    warning: "bg-yellow-50 text-yellow-700 border-yellow-200",
    danger:  "bg-red-50 text-red-700 border-red-200",
    info:    "bg-blue-50 text-blue-700 border-blue-200",
    dark:    "bg-gray-900 text-white border-gray-900",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border",
        variants[variant],
        className
      )}
    >
      {children}
    </span>
  );
}

interface RoleBadgeProps {
  role:       Role;
  className?: string;
}

export function RoleBadge({ role, className }: RoleBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border",
        ROLE_COLORS[role],
        className
      )}
    >
      {ROLE_LABELS[role]}
    </span>
  );
}

