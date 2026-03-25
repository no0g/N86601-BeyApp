import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function CollapsibleSection({
  title,
  description,
  children,
  defaultOpen = true,
  className,
  contentClassName
}) {
  return (
    <Card className={className}>
      <details open={defaultOpen} className="group">
        <summary className="list-none cursor-pointer">
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>{title}</CardTitle>
              {description ? <CardDescription>{description}</CardDescription> : null}
            </div>
            <span className="text-sm text-muted-foreground transition group-open:rotate-180">⌄</span>
          </CardHeader>
        </summary>
        <CardContent className={cn(contentClassName)}>{children}</CardContent>
      </details>
    </Card>
  );
}
