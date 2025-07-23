'use client'

import { Search, Filter, Calendar, Grid3X3 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useTranslations } from 'next-intl'

interface Category {
  id: string
  name: string
}

interface ItemsFiltersProps {
  categories: Category[]
  onSearchChange: (search: string) => void
  onCategoryChange: (categoryId: string) => void
  onStatusChange: (status: string) => void
}

export function ItemsFilters({ categories, onSearchChange, onCategoryChange, onStatusChange }: ItemsFiltersProps) {
  const t = useTranslations()

  return (
    <div className="flex flex-col lg:flex-row gap-4">
      {/* Search Input */}
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
        <Input
          type="text"
          placeholder={t('items.searchPlaceholder')}
          className="pl-10 pr-4 bg-white"
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      {/* Category Filter */}
      <Select onValueChange={onCategoryChange}>
        <SelectTrigger className="w-full lg:w-[200px] bg-white">
          <SelectValue placeholder={t('items.allCategories')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('items.allCategories')}</SelectItem>
          {categories.map((category) => (
            <SelectItem key={category.id} value={category.id}>
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Status Filter */}
      <Select onValueChange={onStatusChange}>
        <SelectTrigger className="w-full lg:w-[180px] bg-white">
          <SelectValue placeholder={t('items.allStatuses')} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{t('items.allStatuses')}</SelectItem>
          <SelectItem value="available">{t('items.available')}</SelectItem>
          <SelectItem value="sold">{t('items.sold')}</SelectItem>
        </SelectContent>
      </Select>

      {/* Date Filter */}
      <Button variant="outline" className="flex items-center gap-2 bg-white">
        <Calendar className="h-4 w-4" />
        {t('items.dateRange')}
      </Button>

      {/* View Toggle */}
      <div className="flex gap-2">
        <Button variant="outline" size="icon" className="bg-white">
          <Grid3X3 className="h-4 w-4" />
        </Button>
        <Button variant="outline" size="icon" className="bg-white">
          <Filter className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}