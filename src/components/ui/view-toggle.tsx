'use client'

import { List, Grid3X3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'

export type ViewType = 'list' | 'grid'

interface ViewToggleProps {
  view: ViewType
  onViewChange: (view: ViewType) => void
  className?: string
}

export function ViewToggle({ view, onViewChange, className }: ViewToggleProps) {
  const t = useTranslations('common')
  
  return (
    <div className={cn("flex items-center border rounded-lg p-1 bg-muted/50", className)}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onViewChange('list')}
        className={cn(
          "h-8 px-3",
          view === 'list' 
            ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm' 
            : 'hover:bg-background/80'
        )}
      >
        <List className="h-4 w-4 mr-2" />
        {t('listView')}
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onViewChange('grid')}
        className={cn(
          "h-8 px-3",
          view === 'grid' 
            ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-sm' 
            : 'hover:bg-background/80'
        )}
      >
        <Grid3X3 className="h-4 w-4 mr-2" />
        {t('gridView')}
      </Button>
    </div>
  )
}