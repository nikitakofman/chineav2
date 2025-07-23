'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

interface MobileSidebarContextType {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  toggle: () => void
}

const MobileSidebarContext = createContext<MobileSidebarContextType | undefined>(undefined)

interface MobileSidebarProviderProps {
  children: ReactNode
}

export function MobileSidebarProvider({ children }: MobileSidebarProviderProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  const toggle = () => setIsOpen(prev => !prev)

  return (
    <MobileSidebarContext.Provider 
      value={{ isOpen, setIsOpen, toggle }}
    >
      {children}
    </MobileSidebarContext.Provider>
  )
}

export function useMobileSidebar() {
  const context = useContext(MobileSidebarContext)
  if (context === undefined) {
    throw new Error('useMobileSidebar must be used within a MobileSidebarProvider')
  }
  return context
}