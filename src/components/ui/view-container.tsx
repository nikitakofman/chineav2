'use client'

import { ReactNode } from 'react'
import { ViewToggle, ViewType } from './view-toggle'
import { useDefaultMobileView } from '@/hooks/use-default-mobile-view'

interface ViewContainerProps {
  children: {
    list: ReactNode
    grid: ReactNode
  }
  className?: string
  showToggle?: boolean
  togglePosition?: 'left' | 'right' | 'center'
  defaultView?: ViewType
  view?: ViewType
  onViewChange?: (view: ViewType) => void
}

export function ViewContainer({ 
  children, 
  className,
  showToggle = true,
  togglePosition = 'right',
  defaultView = 'list',
  view: externalView,
  onViewChange: externalOnViewChange
}: ViewContainerProps) {
  const [internalView, setInternalView] = useDefaultMobileView(defaultView)
  
  const view = externalView ?? internalView
  const setView = externalOnViewChange ?? setInternalView

  const getToggleContainerClass = () => {
    switch (togglePosition) {
      case 'left':
        return 'justify-start'
      case 'center':
        return 'justify-center'
      case 'right':
      default:
        return 'justify-end'
    }
  }

  return (
    <div className={className}>
      {showToggle && (
        <div className={`flex mb-6 ${getToggleContainerClass()}`}>
          <ViewToggle view={view} onViewChange={setView} />
        </div>
      )}
      
      <div>
        {view === 'list' ? children.list : children.grid}
      </div>
    </div>
  )
}