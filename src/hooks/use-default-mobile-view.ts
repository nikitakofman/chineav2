'use client'

import { useState, useEffect } from 'react'
import { ViewType } from '@/components/ui/view-toggle'
import { useIsMobile } from '@/hooks/use-mobile'

export function useDefaultMobileView(defaultView: ViewType = 'list'): [ViewType, (view: ViewType) => void] {
  const isMobile = useIsMobile()
  const [view, setView] = useState<ViewType>(defaultView)

  useEffect(() => {
    // Set grid view by default on mobile
    if (isMobile && view === 'list') {
      setView('grid')
    }
  }, [isMobile])

  return [view, setView]
}