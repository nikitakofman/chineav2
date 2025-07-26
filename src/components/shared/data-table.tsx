'use client'

import React, { ReactNode, useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  MoreHorizontal, 
  Eye, 
  Edit, 
  Trash2, 
  Plus,
  Image as ImageIcon,
  LucideIcon 
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { fr, enUS } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { EmptyState } from './empty-state'
import { ImageViewer } from '@/components/ui/image-viewer'

// ============================================================================
// Types and Interfaces
// ============================================================================

export type ColumnType = 
  | 'text' 
  | 'number' 
  | 'date' 
  | 'datetime' 
  | 'currency' 
  | 'badge' 
  | 'image' 
  | 'actions'
  | 'custom'

export interface BadgeConfig {
  variant?: 'default' | 'secondary' | 'outline' | 'destructive' | 'success' | 'warning'
  className?: string
  valueMap?: Record<string, { label: string; variant?: string; className?: string }>
}

export interface ActionConfig {
  label: string
  icon?: LucideIcon
  onClick: (item: any) => void
  variant?: 'default' | 'destructive'
  visible?: (item: any) => boolean
  disabled?: (item: any) => boolean
  disabledTooltip?: string
}

export interface ColumnDef<T = any> {
  key: string
  header: string
  type: ColumnType
  accessor?: string | ((item: T) => any)
  className?: string
  headerClassName?: string
  align?: 'left' | 'center' | 'right'
  sortable?: boolean
  
  // Type-specific configs
  dateFormat?: string
  relativeDate?: boolean
  currency?: string
  currencyPosition?: 'before' | 'after'
  decimalPlaces?: number
  badgeConfig?: BadgeConfig
  imageConfig?: {
    width?: number
    height?: number
    fallback?: ReactNode
    onClick?: (item: T) => void
  }
  customRender?: (value: any, item: T) => ReactNode
}

export interface DataTableProps<T = any> {
  // Data
  data: T[]
  columns: ColumnDef<T>[]
  keyExtractor: (item: T) => string
  
  // Actions
  actions?: ActionConfig[]
  actionsDropdown?: boolean
  actionsLabel?: string
  
  // Features
  loading?: boolean
  sortable?: boolean
  selectable?: boolean
  selectedItems?: string[]
  onSelectionChange?: (selectedIds: string[]) => void
  
  // Styling
  className?: string
  tableClassName?: string
  minWidth?: string
  striped?: boolean
  hover?: boolean
  
  // Empty state
  emptyState?: {
    icon?: LucideIcon
    title: string
    description?: string
    action?: {
      label: string
      onClick: () => void
    }
  }
  
  // Other
  locale?: 'en' | 'fr'
  renderRowActions?: (item: T) => ReactNode
}

// ============================================================================
// Utility Functions
// ============================================================================

function getValue<T>(item: T, accessor: string | ((item: T) => any)): any {
  if (typeof accessor === 'function') {
    return accessor(item)
  }
  
  // Handle nested accessors like 'user.name'
  const keys = accessor.split('.')
  let value: any = item
  
  for (const key of keys) {
    value = value?.[key]
  }
  
  return value
}

function formatValue(
  value: any,
  column: ColumnDef,
  locale: 'en' | 'fr',
  openImageViewer?: (url: string, alt: string) => void
): ReactNode {
  // Handle null/undefined
  if (value == null || value === '') {
    return <span className="text-muted-foreground">-</span>
  }
  
  const dateLocale = locale === 'fr' ? fr : enUS
  
  switch (column.type) {
    case 'date':
      const date = new Date(value)
      if (column.relativeDate) {
        return formatDistanceToNow(date, { addSuffix: true, locale: dateLocale })
      }
      return format(date, column.dateFormat || 'PPP', { locale: dateLocale })
      
    case 'datetime':
      return format(new Date(value), column.dateFormat || 'PPP HH:mm', { locale: dateLocale })
      
    case 'currency':
      const formatted = typeof value === 'number' 
        ? value.toFixed(column.decimalPlaces ?? 2)
        : value
      const symbol = column.currency || '€'
      return column.currencyPosition === 'after' 
        ? `${formatted}${symbol}`
        : `${symbol}${formatted}`
        
    case 'number':
      return typeof value === 'number' && column.decimalPlaces !== undefined
        ? value.toFixed(column.decimalPlaces)
        : value
        
    case 'badge':
      const badgeConfig = column.badgeConfig?.valueMap?.[value]
      return (
        <Badge 
          variant={badgeConfig?.variant as any || column.badgeConfig?.variant || 'default'}
          className={cn(badgeConfig?.className, column.badgeConfig?.className)}
        >
          {badgeConfig?.label || value}
        </Badge>
      )
      
    case 'image':
      if (!value) {
        return column.imageConfig?.fallback || (
          <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
            <ImageIcon className="w-5 h-5 text-muted-foreground" />
          </div>
        )
      }
      return (
        <img
          src={value}
          alt=""
          width={column.imageConfig?.width || 40}
          height={column.imageConfig?.height || 40}
          className="object-cover rounded cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => {
            if (column.imageConfig?.onClick) {
              column.imageConfig.onClick(value)
            } else if (openImageViewer) {
              openImageViewer(value, '')
            }
          }}
          onError={(e) => {
            // Fallback to placeholder on error
            const target = e.target as HTMLImageElement
            target.src = '/placeholder-image.svg'
            target.onerror = null // Prevent infinite loop
          }}
        />
      )
      
    case 'custom':
      return column.customRender?.(value, value) || value
      
    default:
      return value
  }
}

// ============================================================================
// Loading Skeleton
// ============================================================================

function TableSkeleton({ columns, rows = 5 }: { columns: ColumnDef[]; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <TableRow key={i}>
          {columns.map((column) => (
            <TableCell key={column.key}>
              <Skeleton className="h-4 w-full" />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  )
}

// ============================================================================
// Main DataTable Component
// ============================================================================

export function DataTable<T = any>({
  data,
  columns,
  keyExtractor,
  actions,
  actionsDropdown = true,
  actionsLabel,
  loading = false,
  sortable = false,
  selectable = false,
  selectedItems = [],
  onSelectionChange,
  className,
  tableClassName,
  minWidth = '600px',
  striped = false,
  hover = true,
  emptyState,
  locale = 'en',
  renderRowActions,
}: DataTableProps<T>) {
  const t = useTranslations()
  const [imageViewerOpen, setImageViewerOpen] = useState(false)
  const [currentImageUrl, setCurrentImageUrl] = useState('')
  const [currentImageAlt, setCurrentImageAlt] = useState('')
  
  // Add actions column if needed
  const allColumns = [...columns]
  if (actions?.length || renderRowActions) {
    allColumns.push({
      key: 'actions',
      header: actionsLabel || t('common.actions'),
      type: 'actions' as ColumnType,
      align: 'right',
      headerClassName: 'text-right',
    })
  }
  
  const handleOpenImageViewer = (url: string, alt: string) => {
    setCurrentImageUrl(url)
    setCurrentImageAlt(alt)
    setImageViewerOpen(true)
  }

  // Render empty state
  if (!loading && data.length === 0) {
    return (
      <EmptyState
        icon={emptyState?.icon || Plus}
        title={emptyState?.title || t('common.noData')}
        description={emptyState?.description}
        action={emptyState?.action}
      />
    )
  }
  
  return (
    <>
      <Card className={className}>
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <Table className={tableClassName} style={{ minWidth }}>
            <TableHeader>
              <TableRow>
                {allColumns.map((column) => (
                  <TableHead 
                    key={column.key}
                    className={cn(
                      column.headerClassName,
                      column.align === 'center' && 'text-center',
                      column.align === 'right' && 'text-right'
                    )}
                  >
                    {column.header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableSkeleton columns={allColumns} />
              ) : (
                data.map((item, index) => {
                  const key = keyExtractor(item)
                  return (
                    <TableRow 
                      key={key}
                      className={cn(
                        hover && 'hover:bg-muted/50',
                        striped && index % 2 === 1 && 'bg-muted/20'
                      )}
                    >
                      {allColumns.map((column) => {
                        if (column.type === 'actions') {
                          return (
                            <TableCell key={column.key} className="text-right">
                              {renderRowActions ? (
                                renderRowActions(item)
                              ) : actionsDropdown ? (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <span className="sr-only">{t('common.openMenu')}</span>
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuLabel>{actionsLabel || t('common.actions')}</DropdownMenuLabel>
                                    <DropdownMenuSeparator />
                                    {actions?.map((action, i) => {
                                      const visible = action.visible ? action.visible(item) : true
                                      const disabled = action.disabled ? action.disabled(item) : false
                                      
                                      if (!visible) return null
                                      
                                      const Icon = action.icon
                                      
                                      return (
                                        <DropdownMenuItem
                                          key={i}
                                          onClick={() => !disabled && action.onClick(item)}
                                          disabled={disabled}
                                          className={cn(
                                            action.variant === 'destructive' && 'text-destructive focus:text-destructive'
                                          )}
                                        >
                                          {Icon && <Icon className="mr-2 h-4 w-4" />}
                                          {action.label}
                                        </DropdownMenuItem>
                                      )
                                    })}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              ) : (
                                <div className="flex items-center justify-end gap-2">
                                  {actions?.map((action, i) => {
                                    const visible = action.visible ? action.visible(item) : true
                                    const disabled = action.disabled ? action.disabled(item) : false
                                    
                                    if (!visible) return null
                                    
                                    const Icon = action.icon
                                    
                                    return (
                                      <Button
                                        key={i}
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8"
                                        onClick={() => action.onClick(item)}
                                        disabled={disabled}
                                        title={disabled ? action.disabledTooltip : action.label}
                                      >
                                        {Icon && <Icon className="h-4 w-4" />}
                                        <span className="sr-only">{action.label}</span>
                                      </Button>
                                    )
                                  })}
                                </div>
                              )}
                            </TableCell>
                          )
                        }
                        
                        const value = getValue(item, column.accessor || column.key)
                        
                        return (
                          <TableCell
                            key={column.key}
                            className={cn(
                              column.className,
                              column.align === 'center' && 'text-center',
                              column.align === 'right' && 'text-right'
                            )}
                          >
                            {column.type === 'custom' && column.customRender
                              ? column.customRender(value, item)
                              : formatValue(value, column, locale, handleOpenImageViewer)
                            }
                          </TableCell>
                        )
                      })}
                    </TableRow>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
      
      <ImageViewer
        imageUrl={currentImageUrl}
        alt={currentImageAlt}
        isOpen={imageViewerOpen}
        onClose={() => setImageViewerOpen(false)}
      />
    </>
  )
}