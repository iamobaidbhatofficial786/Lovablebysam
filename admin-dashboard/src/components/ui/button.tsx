import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "ghost" | "link" | "premium"
  size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 disabled:pointer-events-none disabled:opacity-50"
    
    const variants = {
      default: "bg-purple-600 text-white shadow-lg shadow-purple-500/30 hover:bg-purple-700 hover:shadow-xl hover:shadow-purple-500/40 active:scale-95",
      destructive: "bg-red-600 text-white shadow-lg shadow-red-500/30 hover:bg-red-700 hover:shadow-xl hover:shadow-red-500/40 active:scale-95",
      outline: "border border-purple-500/30 bg-transparent hover:bg-purple-500/10 hover:border-purple-500/50",
      ghost: "hover:bg-white/5 hover:text-purple-400",
      link: "text-purple-400 underline-offset-4 hover:underline",
      premium: "bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/50 hover:shadow-xl hover:shadow-purple-500/60 active:scale-95 relative overflow-hidden before:absolute before:inset-0 before:bg-white/20 before:translate-x-[-100%] hover:before:translate-x-[100%] before:transition-transform before:duration-700"
    }
    
    const sizes = {
      default: "h-10 px-4 py-2",
      sm: "h-8 rounded-md px-3 text-xs",
      lg: "h-12 rounded-lg px-8",
      icon: "h-10 w-10"
    }
    
    return (
      <button
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
