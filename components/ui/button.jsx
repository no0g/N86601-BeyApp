import { cn } from "@/lib/utils";

export function Button({ className, variant = "default", ...props }) {
  const variants = {
    default: "bg-primary text-primary-foreground hover:opacity-90",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
    ghost: "bg-transparent text-foreground hover:bg-muted",
    outline: "border border-border bg-background text-foreground hover:bg-muted"
  };

  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
