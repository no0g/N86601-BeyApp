import { cn } from "@/lib/utils";

export function Input({ className, ...props }) {
  return (
    <input
      className={cn(
        "flex h-11 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background transition placeholder:text-muted-foreground focus:ring-2 focus:ring-ring",
        className
      )}
      {...props}
    />
  );
}
