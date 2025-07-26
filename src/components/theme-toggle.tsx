'use client'

import * as React from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Sun className="w-5 h-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute w-5 h-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[140px] p-2">
        <div className="space-y-2">
          <DropdownMenuItem 
            onClick={() => setTheme('light')}
            className={`cursor-pointer touch-manipulation min-h-[44px] flex items-center rounded-md transition-colors group
              hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground
              ${theme === 'light' ? 'bg-primary text-primary-foreground font-medium' : ''}`}
          >
            <Sun className={`mr-2 h-4 w-4 transition-colors
              group-hover:text-primary-foreground
              ${theme === 'light' ? 'text-primary-foreground' : ''}`} />
            Light
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => setTheme('dark')}
            className={`cursor-pointer touch-manipulation min-h-[44px] flex items-center rounded-md transition-colors group
              hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground
              ${theme === 'dark' ? 'bg-primary text-primary-foreground font-medium' : ''}`}
          >
            <Moon className={`mr-2 h-4 w-4 transition-colors
              group-hover:text-primary-foreground
              ${theme === 'dark' ? 'text-primary-foreground' : ''}`} />
            Dark
          </DropdownMenuItem>
          <DropdownMenuItem 
            onClick={() => setTheme('system')}
            className={`cursor-pointer touch-manipulation min-h-[44px] flex items-center rounded-md transition-colors group
              hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground
              ${theme === 'system' ? 'bg-primary text-primary-foreground font-medium' : ''}`}
          >
            <Sun className={`mr-2 h-4 w-4 opacity-50 transition-colors
              group-hover:text-primary-foreground group-hover:opacity-100
              ${theme === 'system' ? 'text-primary-foreground opacity-100' : ''}`} />
            System
          </DropdownMenuItem>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}