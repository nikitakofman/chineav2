'use client'

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { IncidentsHeader } from './incidents-header'
import { IncidentsTable } from './incidents-table'
import { IncidentsGrid } from './incidents-grid'
import { ViewToggle, ViewType } from '@/components/ui/view-toggle'
import { useDefaultMobileView } from '@/hooks/use-default-mobile-view'
import { SearchFilters } from '@/components/shared/search-filters'
import { DateRange } from 'react-day-picker'

interface IncidentsPageClientProps {
  incidents: Array<{
    id: string
    incident_type: string | null
    description: string | null
    incident_date: Date | null
    reported_by: string | null
    resolution_status: string | null
    created_at: Date | null
    updated_at: Date | null
    items: {
      id: string
      item_number: string | null
      description: string | null
      category: {
        id: string
        name: string
      } | null
    } | null
    incident_images: Array<{
      id: string
      url: string
      file_name: string
      file_size: number | null
      mime_type: string | null
    }>
  }>
  categories?: Array<{
    id: string
    name: string
  }>
}

export function IncidentsPageClient({ incidents, categories = [] }: IncidentsPageClientProps) {
  const [view, setView] = useDefaultMobileView('list')
  const t = useTranslations()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [dateRange, setDateRange] = useState<DateRange | undefined>()

  // Filter incidents based on search and filters
  const filteredIncidents = useMemo(() => {
    return incidents.filter(incident => {
      // Search filter
      if (searchQuery) {
        const searchLower = searchQuery.toLowerCase()
        const matchesSearch = 
          incident.items?.item_number?.toLowerCase().includes(searchLower) ||
          incident.items?.description?.toLowerCase().includes(searchLower) ||
          incident.description?.toLowerCase().includes(searchLower) ||
          incident.items?.category?.name?.toLowerCase().includes(searchLower) ||
          incident.reported_by?.toLowerCase().includes(searchLower)
        
        if (!matchesSearch) return false
      }

      // Category filter
      if (selectedCategory !== 'all' && incident.items?.category?.id !== selectedCategory) {
        return false
      }

      // Date filter for incident date
      if (dateRange?.from || dateRange?.to) {
        const incidentDate = incident.incident_date ? new Date(incident.incident_date) : null
        if (!incidentDate) return false
        
        if (dateRange.from && incidentDate < dateRange.from) return false
        if (dateRange.to && incidentDate > dateRange.to) return false
      }

      return true
    })
  }, [incidents, searchQuery, selectedCategory, dateRange])

  return (
    <div className="space-y-6">
      <IncidentsHeader />
      
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
      
      {view === 'list' ? (
        <IncidentsTable incidents={filteredIncidents} />
      ) : (
        <IncidentsGrid incidents={filteredIncidents} />
      )}
    </div>
  )
}