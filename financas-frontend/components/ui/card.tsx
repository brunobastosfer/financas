import * as React from "react";
import { cn } from "@/lib/utils";

export function Card({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-[22px] border border-[#ebe5e2] bg-card text-card-foreground shadow-[0_8px_30px_rgba(67,41,43,0.045)]",
        className,
      )}
      {...props}
    />
  );
}
