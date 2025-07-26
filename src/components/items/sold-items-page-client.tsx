'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { SoldHeader } from './sold-header'
import { SoldItemsTable } from '@/components/shared/table-configurations'
import { SoldItemsGrid } from '@/components/shared/grid-configurations'
import { ViewContainer } from '@/components/ui/view-container'
import { SearchFilters } from '@/components/shared/search-filters'
import { AddItemModal } from '@/components/shared/modal-configurations'
import { ViewToggle } from '@/components/ui/view-toggle'
import { useDefaultMobileView } from '@/hooks/use-default-mobile-view'
import { DateRange } from 'react-day-picker'

interface SoldItemsPageClientProps {
  items: Array<{
    id: string
    item_number: string | null
    description: string | null
    color: string | null
    grade: string | null
    created_at: Date | null
    category: {
      id: string
      name: string
    } | null
    item_purchases: Array<{
      purchase_price: number | null
      purchase_date: Date | null
      person: {
        name: string
      } | null
    }>
    item_sales: Array<{
      id: string
      sale_price: number | null
      sale_date: Date | null
      sale_location: string | null
      payment_method: string | null
      invoice_id: string | null
      person: {
        name: string
      } | null
    }>
    item_locations: Array<{
      location_type: string | null
      location_details: string | null
    }>
  }>
  categories?: Array<{
    id: string
    name: string
  }>
  invoiceGroups?: Array<{
    id: string
    invoice_number: string
    invoice_date: Date | null
    total_amount: number
    client: {
      id: string
      name: string
      lastname: string | null
    } | null
    items: Array<any>
  }>
}

export function SoldItemsPageClient({ items, categories = [], invoiceGroups = [] }: SoldItemsPageClientProps) {
  const router = useRouter()
  const t = useTranslations()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
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
      if (selectedCategory !== 'all' && item.category?.id !== selectedCategory) {
        return false
      }

      // Date filter for sale date
      if (dateRange?.from || dateRange?.to) {
        const saleDate = item.item_sales?.[0]?.sale_date ? new Date(item.item_sales[0].sale_date) : null
        if (!saleDate) return false
        
        if (dateRange.from && saleDate < dateRange.from) return false
        if (dateRange.to && saleDate > dateRange.to) return false
      }

      return true
    })
  }, [items, searchQuery, selectedCategory, dateRange])

  return (
    <div className="space-y-6">
      <SoldHeader onAddClick={() => setShowAddModal(true)} />
      
      <div className="mt-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <SearchFilters 
          categories={categories}
          onSearchChange={setSearchQuery}
          onCategoryChange={setSelectedCategory}
          onDateRangeChange={setDateRange}
        />
        <div className="flex justify-center sm:justify-end">
          <ViewToggle view={view} onViewChange={setView} />
        </div>
      </div>
      
      <ViewContainer className="mt-6" view={view} onViewChange={setView} showToggle={false}>
        {{
          list: <SoldItemsTable 
            items={filteredItems} 
            categories={categories} 
            invoiceGroups={invoiceGroups}
            onUpdate={handleUpdate} 
          />,
          grid: <SoldItemsGrid 
            items={filteredItems} 
            categories={categories}
            invoiceGroups={invoiceGroups}
          />
        }}
      </ViewContainer>
      
      <AddItemModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        categories={categories}
      />
    </div>
  )
}