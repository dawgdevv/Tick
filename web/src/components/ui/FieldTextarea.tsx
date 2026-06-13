import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface FieldTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string;
}

export const FieldTextarea = forwardRef<HTMLTextAreaElement, FieldTextareaProps>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn("field-textarea custom-scrollbar", className)}
      {...props}
    />
  )
);

FieldTextarea.displayName = "FieldTextarea";
