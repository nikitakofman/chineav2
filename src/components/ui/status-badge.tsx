import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'

type StatusType = 'success' | 'warning' | 'error' | 'info' | 'default' | 'secondary'

interface StatusConfig {
  type: StatusType
  label?: string
  icon?: LucideIcon
  className?: string
}

// Predefined status configurations
const statusConfigs: Record<string, StatusConfig> = {
  // Item statuses
  active: { type: 'success', label: 'Active' },
  inactive: { type: 'secondary', label: 'Inactive' },
  pending: { type: 'warning', label: 'Pending' },
  sold: { type: 'info', label: 'Sold' },
  inStock: { type: 'success', label: 'In Stock' },
  outOfStock: { type: 'error', label: 'Out of Stock' },
  
  // Incident statuses
  resolved: { type: 'success', label: 'Resolved' },
  open: { type: 'warning', label: 'Open' },
  inProgress: { type: 'info', label: 'In Progress' },
  closed: { type: 'secondary', label: 'Closed' },
  
  // Transaction statuses
  completed: { type: 'success', label: 'Completed' },
  cancelled: { type: 'error', label: 'Cancelled' },
  refunded: { type: 'warning', label: 'Refunded' },
  
  // General statuses
  enabled: { type: 'success', label: 'Enabled' },
  disabled: { type: 'secondary', label: 'Disabled' },
  draft: { type: 'secondary', label: 'Draft' },
  published: { type: 'success', label: 'Published' },
  archived: { type: 'secondary', label: 'Archived' },
}

// Color mappings for status types
const statusTypeStyles: Record<StatusType, string> = {
  success: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800',
  warning: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800',
  error: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800',
  info: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950 dark:text-blue-300 dark:border-blue-800',
  default: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-gray-950 dark:text-gray-300 dark:border-gray-800',
  secondary: 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-950 dark:text-gray-400 dark:border-gray-800',
}

interface StatusBadgeProps {
  status: string
  label?: string
  type?: StatusType
  icon?: LucideIcon
  size?: 'default' | 'sm' | 'lg'
  variant?: 'default' | 'outline' | 'secondary' | 'destructive'
  className?: string
  showIcon?: boolean
}

export function StatusBadge({
  status,
  label,
  type,
  icon,
  size = 'default',
  variant,
  className,
  showIcon = true,
}: StatusBadgeProps) {
  // Get predefined config if available
  const predefinedConfig = statusConfigs[status]
  
  // Determine final values (props override predefined)
  const finalType = type || predefinedConfig?.type || 'default'
  const finalLabel = label || predefinedConfig?.label || status
  const Icon = icon || predefinedConfig?.icon
  
  // Use custom styles for better status visibility
  const useCustomStyles = !variant
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    default: 'text-sm px-2.5 py-0.5',
    lg: 'text-base px-3 py-1',
  }

  if (useCustomStyles) {
    return (
      <span
        className={cn(
          'inline-flex items-center gap-1.5 font-medium rounded-full border',
          statusTypeStyles[finalType],
          sizeClasses[size],
          className
        )}
      >
        {showIcon && Icon && <Icon className={cn(
          'shrink-0',
          size === 'sm' && 'h-3 w-3',
          size === 'default' && 'h-3.5 w-3.5',
          size === 'lg' && 'h-4 w-4'
        )} />}
        {finalLabel}
      </span>
    )
  }

  // Fallback to standard Badge component
  return (
    <Badge
      variant={variant}
      className={cn(
        'inline-flex items-center gap-1.5',
        sizeClasses[size],
        className
      )}
    >
      {showIcon && Icon && <Icon className={cn(
        'shrink-0',
        size === 'sm' && 'h-3 w-3',
        size === 'default' && 'h-3.5 w-3.5',
        size === 'lg' && 'h-4 w-4'
      )} />}
      {finalLabel}
    </Badge>
  )
}

// Export preset status badges for common use cases
export const StatusBadges = {
  Active: (props?: Omit<StatusBadgeProps, 'status'>) => (
    <StatusBadge status="active" {...props} />
  ),
  Inactive: (props?: Omit<StatusBadgeProps, 'status'>) => (
    <StatusBadge status="inactive" {...props} />
  ),
  Sold: (props?: Omit<StatusBadgeProps, 'status'>) => (
    <StatusBadge status="sold" {...props} />
  ),
  InStock: (props?: Omit<StatusBadgeProps, 'status'>) => (
    <StatusBadge status="inStock" {...props} />
  ),
  Resolved: (props?: Omit<StatusBadgeProps, 'status'>) => (
    <StatusBadge status="resolved" {...props} />
  ),
  Open: (props?: Omit<StatusBadgeProps, 'status'>) => (
    <StatusBadge status="open" {...props} />
  ),
  Completed: (props?: Omit<StatusBadgeProps, 'status'>) => (
    <StatusBadge status="completed" {...props} />
  ),
}