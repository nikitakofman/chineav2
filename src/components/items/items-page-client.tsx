'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { ItemsHeader } from './items-header'
import { ItemsTable } from '@/components/shared/table-configurations'
import { ItemsGrid } from '@/components/shared/grid-configurations'
import { SearchFilters } from '@/components/shared/search-filters'
import { AddItemModal } from '@/components/shared/modal-configurations'
import { ViewToggle, ViewType } from '@/components/ui/view-toggle'
import { useDefaultMobileView } from '@/hooks/use-default-mobile-view'
import { DateRange } from 'react-day-picker'

interface ItemsPageClientProps {
  items: any[]
  categories: any[]
}

export function ItemsPageClient({ items, categories }: ItemsPageClientProps) {
  const router = useRouter()
  const [showAddModal, setShowAddModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('all') // eslint-disable-line @typescript-eslint/no-unused-vars
  const [view, setView] = useDefaultMobileView('list')
  const [dateRange, setDateRange] = useState<DateRange | undefined>()

  const handleUpdate = () => {
    router.refresh()
  }

  // Filter items based on search and filters
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      // Search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase()
        const matchesSearch = 
          item.item_number?.toLowerCase().includes(searchLower) ||
          item.description?.toLowerCase().includes(searchLower) ||
          item.category?.name?.toLowerCase().includes(searchLower)
        
        if (!matchesSearch) return false
      }

      // Category filter
      if (selectedCategory !== 'all' && item.category_id !== selectedCategory) {
        return false
      }

      // Note: Status filter removed as items page only shows in-stock items

      // Date filter
      if (dateRange?.from || dateRange?.to) {
        const itemDate = item.created_at ? new Date(item.created_at) : null
        if (!itemDate) return false
        
        if (dateRange.from && itemDate < dateRange.from) return false
        if (dateRange.to && itemDate > dateRange.to) return false
      }

      return true
    })
  }, [items, searchQuery, selectedCategory, selectedStatus, dateRange])

  return (
    <>
      <ItemsHeader onAddClick={() => setShowAddModal(true)} />
      
      <div className="mt-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex-1">
          <SearchFilters 
            categories={categories}
            onSearchChange={setSearchQuery}
            onCategoryChange={setSelectedCategory}
            onDateRangeChange={setDateRange}
          />
        </div>
        <div className="flex justify-center sm:justify-end">
          <ViewToggle view={view} onViewChange={setView} />
        </div>
      </div>

      <div className="mt-6">
        {view === 'list' ? (
          <ItemsTable items={filteredItems} categories={categories} onUpdate={handleUpdate} />
        ) : (
          <ItemsGrid items={filteredItems} categories={categories} onUpdate={handleUpdate} />
        )}
      </div>

      <AddItemModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        categories={categories}
      />
    </>
  )
}