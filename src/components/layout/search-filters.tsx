'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DateRangePickerCompact } from '@/components/ui/date-range-picker-compact'
import { DateRange } from 'react-day-picker'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

interface SelectOption {
  value: string
  label: string
}

interface FilterConfig {
  type: 'text' | 'select' | 'date-range'
  key: string
  label?: string
  placeholder?: string
  icon?: React.ComponentType<{ className?: string }>
  options?: SelectOption[]
  className?: string
}

interface SearchFiltersProps {
  filters: FilterConfig[]
  onFiltersChange: (filters: Record<string, any>) => void
  searchPlaceholder?: string
  searchDebounceMs?: number
  showClearButton?: boolean
  className?: string
  filtersClassName?: string
}

export function SearchFilters({
  filters,
  onFiltersChange,
  searchPlaceholder = 'Search...',
  searchDebounceMs = 300,
  showClearButton = true,
  className,
  filtersClassName,
}: SearchFiltersProps) {
  const [filterValues, setFilterValues] = useState<Record<string, any>>({})
  const [searchValue, setSearchValue] = useState('')
  const [debouncedSearchValue, setDebouncedSearchValue] = useState('')

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchValue(searchValue)
    }, searchDebounceMs)

    return () => clearTimeout(timer)
  }, [searchValue, searchDebounceMs])

  // Notify parent of filter changes
  useEffect(() => {
    const allFilters = {
      ...filterValues,
      ...(debouncedSearchValue ? { search: debouncedSearchValue } : {}),
    }
    onFiltersChange(allFilters)
  }, [filterValues, debouncedSearchValue, onFiltersChange])

  const handleFilterChange = useCallback((key: string, value: any) => {
    setFilterValues(prev => {
      if (value === 'all' || value === null || value === undefined) {
        const { [key]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [key]: value }
    })
  }, [])

  const handleClearFilters = useCallback(() => {
    setFilterValues({})
    setSearchValue('')
    setDebouncedSearchValue('')
  }, [])

  const activeFiltersCount = Object.keys(filterValues).length + (searchValue ? 1 : 0)

  // Find text filter
  const textFilter = filters.find(f => f.type === 'text')
  const otherFilters = filters.filter(f => f.type !== 'text')

  return (
    <div className={cn('space-y-4', className)}>
      <div className={cn(
        'flex flex-col lg:flex-row gap-4',
        filtersClassName
      )}>
        {/* Search Input (text filter) */}
        {textFilter && (
          <div className="flex-1 relative">
            {textFilter.icon ? (
              <textFilter.icon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            ) : (
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            )}
            <Input
              type="text"
              placeholder={textFilter.placeholder || searchPlaceholder}
              className={cn(
                'pl-10 pr-4 bg-white h-10',
                textFilter.className
              )}
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
            />
          </div>
        )}

        {/* Other Filters */}
        {otherFilters.map((filter) => {
          switch (filter.type) {
            case 'select':
              return (
                <Select
                  key={filter.key}
                  value={filterValues[filter.key] || 'all'}
                  onValueChange={(value) => handleFilterChange(filter.key, value)}
                >
                  <SelectTrigger className={cn(
                    'w-full lg:w-[200px] bg-white h-10',
                    filter.className
                  )}>
                    <SelectValue placeholder={filter.placeholder || filter.label} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">
                      {filter.placeholder || `All ${filter.label}`}
                    </SelectItem>
                    {filter.options?.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )

            case 'date-range':
              return (
                <DateRangePickerCompact
                  key={filter.key}
                  onUpdate={(values) => {
                    handleFilterChange(filter.key, values.range)
                  }}
                  align="start"
                  className={filter.className}
                />
              )

            default:
              return null
          }
        })}

        {/* Clear Filters Button */}
        {showClearButton && activeFiltersCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearFilters}
            className="h-10 px-3"
          >
            <X className="h-4 w-4 mr-1" />
            Clear ({activeFiltersCount})
          </Button>
        )}
      </div>

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {searchValue && (
            <Badge variant="secondary" className="gap-1">
              Search: {searchValue}
              <button
                onClick={() => setSearchValue('')}
                className="ml-1 rounded-full hover:bg-muted"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          )}
          
          {Object.entries(filterValues).map(([key, value]) => {
            const filter = filters.find(f => f.key === key)
            if (!filter) return null

            let displayValue = value
            if (filter.type === 'select' && filter.options) {
              const option = filter.options.find(o => o.value === value)
              displayValue = option?.label || value
            } else if (filter.type === 'date-range' && value) {
              const range = value as DateRange
              displayValue = `${range.from?.toLocaleDateString() || ''} - ${range.to?.toLocaleDateString() || ''}`
            }

            return (
              <Badge key={key} variant="secondary" className="gap-1">
                {filter.label}: {displayValue}
                <button
                  onClick={() => handleFilterChange(key, null)}
                  className="ml-1 rounded-full hover:bg-muted"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )
          })}
        </div>
      )}
    </div>
  )
}