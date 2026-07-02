import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date))
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount)
}

export function getStatusColor(status: string) {
  const colors: Record<string, string> = {
    active: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
    inactive: "text-gray-400 bg-gray-400/10 border-gray-400/20",
    suspended: "text-amber-400 bg-amber-400/10 border-amber-400/20",
    revoked: "text-red-400 bg-red-400/10 border-red-400/20",
    expired: "text-orange-400 bg-orange-400/10 border-orange-400/20",
  }
  return colors[status] || colors.inactive
}
