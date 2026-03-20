"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

export function SubmitButton({ children, pendingLabel = "Saving...", ...props }) {
  const { pending } = useFormStatus();

  return (
    <Button disabled={pending} {...props}>
      {pending ? pendingLabel : children}
    </Button>
  );
}
