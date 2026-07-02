import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "warning" | "error" | "info"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default: "bg-white/10 text-gray-300 border-white/20",
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-sm shadow-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/20 shadow-sm shadow-amber-500/20",
    error: "bg-red-500/10 text-red-400 border-red-500/20 shadow-sm shadow-red-500/20",
    info: "bg-blue-500/10 text-blue-400 border-blue-500/20 shadow-sm shadow-blue-500/20"
  }
  
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all",
        variants[variant],
        className
      )}
      {...props}
    />
  )
}

export { Badge }
