import { cn } from "@/lib/utils";

export function Select({ className, children, ...props }) {
  return (
    <select
      className={cn(
        "flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}
