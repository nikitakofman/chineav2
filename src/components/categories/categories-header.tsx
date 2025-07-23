'use client'

import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'

interface CategoriesHeaderProps {
  onAddClick: () => void
}

export function CategoriesHeader({ onAddClick }: CategoriesHeaderProps) {
  const t = useTranslations()

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t('navigation.categories')}</h1>
        <p className="text-muted-foreground mt-1 text-sm sm:text-base">
          {t('categories.subtitle')}
        </p>
      </div>
      <Button onClick={onAddClick} className="flex items-center gap-2 self-end">
        <Plus className="h-4 w-4" />
        <span className="sm:inline">{t('categories.addNewCategory')}</span>
      </Button>
    </div>
  )
}