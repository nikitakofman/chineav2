'use client'

import { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { ViewToggle, ViewType } from '@/components/ui/view-toggle'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from './empty-state'
import { PageHeader } from './page-header'
import { SearchFilters } from './search-filters'
import { LucideIcon } from 'lucide-react'

interface DataPageLayoutProps {
  // Header props
  title: string
  subtitle?: string
  icon?: LucideIcon
  breadcrumbs?: Array<{ label: string; href?: string }>
  actions?: Array<{
    label: string
    onClick: () => void
    icon?: LucideIcon
    variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive'
  }>
  
  // Search and filter props
  searchFilters?: ReactNode
  
  // View toggle props
  showViewToggle?: boolean
  view?: ViewType
  onViewChange?: (view: ViewType) => void
  
  // Content props
  children: ReactNode
  
  // Empty state props
  showEmptyState?: boolean
  emptyStateConfig?: {
    icon?: LucideIcon
    title?: string
    description?: string
    action?: {
      label: string
      onClick: () => void
    }
  }
  
  // Loading state
  isLoading?: boolean
  loadingRowsCount?: number
  
  // Layout customization
  className?: string
  contentClassName?: string
  filtersClassName?: string
}

export function DataPageLayout({
  // Header props
  title,
  subtitle,
  icon,
  breadcrumbs,
  actions,
  
  // Search and filter props
  searchFilters,
  
  // View toggle props
  showViewToggle = true,
  view = 'list',
  onViewChange,
  
  // Content props
  children,
  
  // Empty state props
  showEmptyState = false,
  emptyStateConfig,
  
  // Loading state
  isLoading = false,
  loadingRowsCount = 5,
  
  // Layout customization
  className,
  contentClassName,
  filtersClassName,
}: DataPageLayoutProps) {
  return (
    <div className={cn('p-4 md:p-6 space-y-6', className)}>
      {/* Page Header */}
      <PageHeader
        title={title}
        subtitle={subtitle}
        icon={icon}
        breadcrumbs={breadcrumbs}
        actions={actions}
      />
      
      {/* Search, Filters, and View Toggle */}
      {(searchFilters || showViewToggle) && (
        <div className={cn(
          'flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4',
          filtersClassName
        )}>
          {/* Search and Filters */}
          {searchFilters && (
            <div className="flex-1">
              {searchFilters}
            </div>
          )}
          
          {/* View Toggle */}
          {showViewToggle && onViewChange && (
            <div className="flex justify-center sm:justify-end">
              <ViewToggle view={view} onViewChange={onViewChange} />
            </div>
          )}
        </div>
      )}
      
      {/* Content Area */}
      <div className={cn('', contentClassName)}>
        {isLoading ? (
          <LoadingSkeleton view={view} rowsCount={loadingRowsCount} />
        ) : showEmptyState ? (
          <EmptyState
            icon={emptyStateConfig?.icon}
            title={emptyStateConfig?.title}
            description={emptyStateConfig?.description}
            action={emptyStateConfig?.action}
          />
        ) : (
          children
        )}
      </div>
    </div>
  )
}

// Loading skeleton component
function LoadingSkeleton({ view, rowsCount }: { view: ViewType; rowsCount: number }) {
  if (view === 'grid') {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: rowsCount }).map((_, i) => (
          <div key={i} className="space-y-3">
            <Skeleton className="h-48 w-full rounded-lg" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    )
  }
  
  return (
    <div className="space-y-3">
      {/* Table header skeleton */}
      <div className="flex items-center space-x-4 p-4 border-b">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-4 w-20 ml-auto" />
      </div>
      
      {/* Table rows skeleton */}
      {Array.from({ length: rowsCount }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4 p-4 border-b">
          <Skeleton className="h-10 w-10 rounded" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-48" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-8 w-24" />
        </div>
      ))}
    </div>
  )
}