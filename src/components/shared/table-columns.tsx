'use client'

import { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ColumnDef } from './data-table'
import { formatDistanceToNow } from 'date-fns'
import { fr, enUS } from 'date-fns/locale'

// ============================================================================
// Common Column Definitions
// ============================================================================

/**
 * Creates a text column with optional truncation
 */
export function createTextColumn<T>(
  key: string,
  header: string,
  options?: {
    accessor?: string | ((item: T) => any)
    className?: string
    truncate?: boolean
    maxWidth?: string
  }
): ColumnDef<T> {
  return {
    key,
    header,
    type: 'text',
    accessor: options?.accessor,
    className: options?.truncate 
      ? `truncate ${options.maxWidth || 'max-w-[200px]'} ${options.className || ''}`
      : options?.className,
  }
}

/**
 * Creates a date column with relative time display
 */
export function createDateColumn<T>(
  key: string,
  header: string,
  options?: {
    accessor?: string | ((item: T) => any)
    relative?: boolean
    format?: string
  }
): ColumnDef<T> {
  return {
    key,
    header,
    type: 'date',
    accessor: options?.accessor,
    relativeDate: options?.relative ?? true,
    dateFormat: options?.format,
  }
}

/**
 * Creates a currency column
 */
export function createCurrencyColumn<T>(
  key: string,
  header: string,
  options?: {
    accessor?: string | ((item: T) => any)
    currency?: string
    align?: 'left' | 'center' | 'right'
  }
): ColumnDef<T> {
  return {
    key,
    header,
    type: 'currency',
    accessor: options?.accessor,
    currency: options?.currency || '€',
    align: options?.align || 'right',
    headerClassName: options?.align === 'right' ? 'text-right' : undefined,
  }
}

/**
 * Creates a status badge column
 */
export function createStatusColumn<T>(
  key: string,
  header: string,
  statusMap: Record<string, { label: string; variant?: string; className?: string }>,
  accessor?: string | ((item: T) => any)
): ColumnDef<T> {
  return {
    key,
    header,
    type: 'badge',
    accessor,
    badgeConfig: {
      valueMap: statusMap,
    },
  }
}

/**
 * Creates an image column with viewer
 */
export function createImageColumn<T>(
  key: string,
  header: string,
  options: {
    accessor: string | ((item: T) => any)
    titleAccessor?: string | ((item: T) => any)
    altAccessor?: string | ((item: T) => any)
    countAccessor?: string | ((item: T) => any)
    imagesAccessor?: string | ((item: T) => any)
  }
): ColumnDef<T> {
  return {
    key,
    header,
    type: 'image',
    accessor: options.accessor,
    imageConfig: {
      width: 40,
      height: 40,
      fallback: (
        <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
          <span className="text-xs text-muted-foreground">-</span>
        </div>
      ),
    },
  }
}

/**
 * Creates a person column with avatar
 */
export function createPersonColumn<T>(
  key: string,
  header: string,
  options: {
    nameAccessor: string | ((item: T) => any)
    lastNameAccessor?: string | ((item: T) => any)
    avatarAccessor?: string | ((item: T) => any)
  }
): ColumnDef<T> {
  return {
    key,
    header,
    type: 'custom',
    customRender: (_, item) => {
      const name = typeof options.nameAccessor === 'function' 
        ? options.nameAccessor(item) 
        : item[options.nameAccessor]
        
      const lastName = options.lastNameAccessor
        ? (typeof options.lastNameAccessor === 'function' 
          ? options.lastNameAccessor(item) 
          : item[options.lastNameAccessor])
        : undefined
        
      const avatar = options.avatarAccessor
        ? (typeof options.avatarAccessor === 'function' 
          ? options.avatarAccessor(item) 
          : item[options.avatarAccessor])
        : undefined
      
      if (!name) {
        return <span className="text-muted-foreground">-</span>
      }
      
      const fullName = lastName ? `${name} ${lastName}` : name
      const initials = lastName 
        ? `${name[0]}${lastName[0]}`.toUpperCase()
        : name.slice(0, 2).toUpperCase()
      
      return (
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback>{initials}</AvatarFallback>
          </Avatar>
          <span>{fullName}</span>
        </div>
      )
    },
  }
}

/**
 * Creates a category column with optional parent
 */
export function createCategoryColumn<T>(
  key: string,
  header: string,
  options: {
    nameAccessor: string | ((item: T) => any)
    parentAccessor?: string | ((item: T) => any)
  }
): ColumnDef<T> {
  return {
    key,
    header,
    type: 'custom',
    customRender: (_, item) => {
      const name = typeof options.nameAccessor === 'function' 
        ? options.nameAccessor(item) 
        : item[options.nameAccessor]
        
      const parent = options.parentAccessor
        ? (typeof options.parentAccessor === 'function' 
          ? options.parentAccessor(item) 
          : item[options.parentAccessor])
        : undefined
      
      if (!name) {
        return <span className="text-muted-foreground">-</span>
      }
      
      return (
        <div>
          {parent && (
            <span className="text-xs text-muted-foreground">{parent} / </span>
          )}
          <span>{name}</span>
        </div>
      )
    },
  }
}

/**
 * Creates a custom column with a render function
 */
export function createCustomColumn<T>(
  key: string,
  header: string,
  render: (item: T) => ReactNode,
  options?: {
    className?: string
    align?: 'left' | 'center' | 'right'
  }
): ColumnDef<T> {
  return {
    key,
    header,
    type: 'custom',
    customRender: (_, item) => render(item),
    className: options?.className,
    align: options?.align,
    headerClassName: options?.align === 'right' ? 'text-right' : undefined,
  }
}

// ============================================================================
// Common Action Definitions
// ============================================================================

import { Eye, Edit, Trash2, DollarSign, AlertTriangle, Package, FileDown } from 'lucide-react'
import { ActionConfig } from './data-table'

export function createViewAction<T>(
  onClick: (item: T) => void,
  label?: string
): ActionConfig {
  return {
    label: label || 'View',
    icon: Eye,
    onClick,
  }
}

export function createEditAction<T>(
  onClick: (item: T) => void,
  label?: string
): ActionConfig {
  return {
    label: label || 'Edit',
    icon: Edit,
    onClick,
  }
}

export function createDeleteAction<T>(
  onClick: (item: T) => void,
  options?: {
    label?: string
    disabled?: (item: T) => boolean
    disabledTooltip?: string
  }
): ActionConfig {
  return {
    label: options?.label || 'Delete',
    icon: Trash2,
    onClick,
    variant: 'destructive',
    disabled: options?.disabled,
    disabledTooltip: options?.disabledTooltip,
  }
}

export function createSellAction<T>(
  onClick: (item: T) => void,
  label?: string
): ActionConfig {
  return {
    label: label || 'Mark as Sold',
    icon: DollarSign,
    onClick,
  }
}

export function createIncidentAction<T>(
  onClick: (item: T) => void,
  label?: string
): ActionConfig {
  return {
    label: label || 'Report Incident',
    icon: AlertTriangle,
    onClick,
  }
}

export function createInvoiceAction<T>(
  onClick: (item: T) => void,
  label?: string
): ActionConfig {
  return {
    label: label || 'Download Invoice',
    icon: FileDown,
    onClick,
  }
}

export function createCustomAction<T>(
  key: string,
  render: (item: T) => React.ReactNode,
  options?: {
    width?: string
  }
): ActionConfig {
  return {
    label: key,
    render,
    ...options
  }
}