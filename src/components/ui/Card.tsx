import { cn } from "@/lib/utils";

interface CardProps {
  className?: string;
  children:   React.ReactNode;
  hover?:     boolean;
  glass?:     boolean;
}

export function Card({ className, children, hover = false, glass = false }: CardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-[#eaddd7] bg-white p-6 shadow-sm transition-all duration-300",
        glass && "glass-premium border-white/40",
        hover && "hover:border-[#d4bda8] hover:shadow-elegant -translate-y-1 hover:-translate-y-2",
        className
      )}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("mb-5 pb-5 border-b border-[#eaddd7]", className)}>
      {children}
    </div>
  );
}

export function CardTitle({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <h3 className={cn("text-xl font-bold text-[#3b2b20] font-display tracking-tight", className)}>
      {children}
    </h3>
  );
}
