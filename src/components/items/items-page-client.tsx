'use client'

import { useState, useCallback, useTransition } from 'react'
import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { ItemsHeader } from './items-header'
import { ItemsTable } from '@/components/shared/table-configurations'
import { ItemsGrid } from '@/components/shared/grid-configurations'
import { SearchFilters } from '@/components/shared/search-filters'
import { AddItemModal } from '@/components/shared/modal-configurations'
import { ViewToggle, ViewType } from '@/components/ui/view-toggle'
import { useDefaultMobileView } from '@/hooks/use-default-mobile-view'
import { DateRange } from 'react-day-picker'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'

interface ItemsPageClientProps {
  items: any[]
  categories: any[]
  currentPage: number
  totalPages: number
  totalItems: number
}

export function ItemsPageClient({ items, categories, currentPage, totalPages, totalItems }: ItemsPageClientProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [showAddModal, setShowAddModal] = useState(false)
  const [view, setView] = useDefaultMobileView('list')
  
  // Get current search params from URL
  const currentSearch = searchParams.get('search') || ''
  const currentCategory = searchParams.get('category') || 'all'

  const handleUpdate = () => {
    router.refresh()
  }

  // Handle search and filter changes by updating URL params
  const updateSearchParams = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams)
    
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '' || value === 'all') {
        params.delete(key)
      } else {
        params.set(key, value)
      }
    })
    
    // Reset to page 1 when filters change
    if ('search' in updates || 'category' in updates) {
      params.delete('page')
    }
    
    const newUrl = `${pathname}?${params.toString()}`
    startTransition(() => {
      router.push(newUrl)
    })
  }, [pathname, router, searchParams])

  const handleSearchChange = (value: string) => {
    updateSearchParams({ search: value })
  }

  const handleCategoryChange = (value: string) => {
    updateSearchParams({ category: value })
  }

  const handlePageChange = (page: number) => {
    updateSearchParams({ page: page.toString() })
  }

  // Generate pagination links
  const renderPaginationItems = () => {
    const items = []
    const maxVisible = 5
    
    if (totalPages <= maxVisible) {
      // Show all pages if total is small
      for (let i = 1; i <= totalPages; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              href="#"
              onClick={(e) => {
                e.preventDefault()
                handlePageChange(i)
              }}
              isActive={i === currentPage}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        )
      }
    } else {
      // Show first page
      items.push(
        <PaginationItem key={1}>
          <PaginationLink
            href="#"
            onClick={(e) => {
              e.preventDefault()
              handlePageChange(1)
            }}
            isActive={1 === currentPage}
          >
            1
          </PaginationLink>
        </PaginationItem>
      )
      
      // Show ellipsis and pages around current
      if (currentPage > 3) {
        items.push(<PaginationEllipsis key="ellipsis-1" />)
      }
      
      const start = Math.max(2, currentPage - 1)
      const end = Math.min(totalPages - 1, currentPage + 1)
      
      for (let i = start; i <= end; i++) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              href="#"
              onClick={(e) => {
                e.preventDefault()
                handlePageChange(i)
              }}
              isActive={i === currentPage}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        )
      }
      
      if (currentPage < totalPages - 2) {
        items.push(<PaginationEllipsis key="ellipsis-2" />)
      }
      
      // Show last page
      if (totalPages > 1) {
        items.push(
          <PaginationItem key={totalPages}>
            <PaginationLink
              href="#"
              onClick={(e) => {
                e.preventDefault()
                handlePageChange(totalPages)
              }}
              isActive={totalPages === currentPage}
            >
              {totalPages}
            </PaginationLink>
          </PaginationItem>
        )
      }
    }
    
    return items
  }

  return (
    <>
      <ItemsHeader onAddClick={() => setShowAddModal(true)} />
      
      <div className="mt-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex-1">
          <SearchFilters 
            categories={categories}
            onSearchChange={handleSearchChange}
            onCategoryChange={handleCategoryChange}
            searchValue={currentSearch}
            categoryValue={currentCategory}
            hideDate
          />
        </div>
        <div className="flex justify-center sm:justify-end">
          <ViewToggle view={view} onViewChange={setView} />
        </div>
      </div>

      <div className="mt-6">
        <div className="mb-4 text-sm text-muted-foreground">
          Showing {items.length} of {totalItems} items
          {isPending && <span className="ml-2">(Loading...)</span>}
        </div>
        
        {view === 'list' ? (
          <ItemsTable items={items} categories={categories} onUpdate={handleUpdate} />
        ) : (
          <ItemsGrid items={items} categories={categories} onUpdate={handleUpdate} />
        )}
      </div>

      {totalPages > 1 && (
        <div className="mt-6">
          <Pagination>
            <PaginationContent>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  if (currentPage > 1) handlePageChange(currentPage - 1)
                }}
                className={currentPage === 1 ? 'pointer-events-none opacity-50' : ''}
              />
              {renderPaginationItems()}
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault()
                  if (currentPage < totalPages) handlePageChange(currentPage + 1)
                }}
                className={currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}
              />
            </PaginationContent>
          </Pagination>
        </div>
      )}

      <AddItemModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        categories={categories}
      />
    </>
  )
}