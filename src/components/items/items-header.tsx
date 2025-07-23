'use client'

import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'

interface ItemsHeaderProps {
  onAddClick: () => void
}

export function ItemsHeader({ onAddClick }: ItemsHeaderProps) {
  const t = useTranslations()

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          {t('items.title')}
          <span className="text-lg sm:text-xl font-normal text-muted-foreground mx-2">/</span>
          <span className="text-lg sm:text-xl font-normal text-muted-foreground">{t('items.inStock', 'In Stock')}</span>
        </h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">{t('items.subtitle')}</p>
      </div>
      <Button onClick={onAddClick} className="flex items-center gap-2 self-end">
        <Plus className="h-4 w-4" />
        <span className="sm:inline">{t('navigation.addNewItem')}</span>
      </Button>
    </div>
  )
}