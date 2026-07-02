"use client"

import { Search, Bell, Moon, Sun } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useState } from "react"

export function Header() {
  const [darkMode, setDarkMode] = useState(true)

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 glass border-b border-white/10 px-6 backdrop-blur-xl">
      {/* Search */}
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            type="search"
            placeholder="Search licenses, devices, or users..."
            className="pl-10 bg-white/5 border-white/10 focus:border-purple-500/50"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <Button 
          variant="ghost" 
          size="icon"
          className="relative"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500 animate-pulse" />
        </Button>
        
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setDarkMode(!darkMode)}
        >
          {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </Button>

        <div className="ml-2 h-8 w-px bg-white/10" />

        <Button variant="premium" size="sm">
          Upgrade Plan
        </Button>
      </div>
    </header>
  )
}
