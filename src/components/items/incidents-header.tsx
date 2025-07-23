'use client'

import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'

interface IncidentsHeaderProps {
  onAddClick?: () => void
}

export function IncidentsHeader({ onAddClick }: IncidentsHeaderProps) {
  const t = useTranslations()

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          {t('navigation.items')}
          <span className="text-lg sm:text-xl font-normal text-muted-foreground mx-2">/</span>
          <span className="text-lg sm:text-xl font-normal text-muted-foreground">{t('navigation.incidents')}</span>
        </h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          {t('items.incidentsSubtitle', 'Track and manage item incidents and issues')}
        </p>
      </div>
    </div>
  )
}