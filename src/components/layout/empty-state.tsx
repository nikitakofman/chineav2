'use client'

import { LucideIcon, Package, FileText, Users, FolderOpen, Inbox } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon?: LucideIcon
  title?: string
  description?: string
  action?: {
    label: string
    onClick: () => void
    icon?: LucideIcon
  }
  variant?: 'default' | 'search' | 'error' | 'minimal'
  className?: string
  iconClassName?: string
  titleClassName?: string
  descriptionClassName?: string
}

const defaultIcons: Record<string, LucideIcon> = {
  default: Inbox,
  items: Package,
  documents: FileText,
  people: Users,
  folders: FolderOpen,
}

const defaultTitles: Record<string, string> = {
  default: 'No data yet',
  search: 'No results found',
  error: 'Something went wrong',
}

const defaultDescriptions: Record<string, string> = {
  default: 'Get started by adding your first item',
  search: 'Try adjusting your search or filters',
  error: 'Please try again later or contact support',
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  variant = 'default',
  className,
  iconClassName,
  titleClassName,
  descriptionClassName,
}: EmptyStateProps) {
  const Icon = icon || defaultIcons[variant] || defaultIcons.default
  const displayTitle = title || defaultTitles[variant] || defaultTitles.default
  const displayDescription = description || defaultDescriptions[variant] || defaultDescriptions.default

  return (
    <div className={cn(
      'flex flex-col items-center justify-center py-12 px-4 text-center',
      variant === 'minimal' ? 'py-8' : 'py-12',
      className
    )}>
      {/* Icon */}
      <div className={cn(
        'rounded-full p-3 mb-4',
        variant === 'error' ? 'bg-red-50 dark:bg-red-950' : 'bg-muted',
        variant === 'minimal' && 'p-2 mb-3'
      )}>
        <Icon className={cn(
          'text-muted-foreground',
          variant === 'error' && 'text-red-500',
          variant === 'minimal' ? 'h-8 w-8' : 'h-12 w-12',
          iconClassName
        )} />
      </div>

      {/* Title */}
      <h3 className={cn(
        'font-semibold',
        variant === 'minimal' ? 'text-base' : 'text-lg',
        titleClassName
      )}>
        {displayTitle}
      </h3>

      {/* Description */}
      {displayDescription && (
        <p className={cn(
          'text-muted-foreground mt-1 max-w-sm',
          variant === 'minimal' ? 'text-xs' : 'text-sm',
          descriptionClassName
        )}>
          {displayDescription}
        </p>
      )}

      {/* Action Button */}
      {action && (
        <Button
          onClick={action.onClick}
          variant={variant === 'error' ? 'destructive' : 'default'}
          size={variant === 'minimal' ? 'sm' : 'default'}
          className="mt-6 flex items-center gap-2"
        >
          {action.icon && <action.icon className="h-4 w-4" />}
          {action.label}
        </Button>
      )}
    </div>
  )
}

// Preset empty states for common scenarios
export const EmptyStates = {
  Items: (props: Omit<EmptyStateProps, 'icon' | 'title' | 'description'>) => (
    <EmptyState
      icon={Package}
      title="No items yet"
      description="Start by adding your first item to track"
      {...props}
    />
  ),

  SearchResults: (props: Omit<EmptyStateProps, 'variant' | 'title' | 'description'>) => (
    <EmptyState
      variant="search"
      title="No results found"
      description="Try adjusting your search or filters"
      {...props}
    />
  ),

  Documents: (props: Omit<EmptyStateProps, 'icon' | 'title' | 'description'>) => (
    <EmptyState
      icon={FileText}
      title="No documents"
      description="Upload documents to keep them organized"
      {...props}
    />
  ),

  People: (props: Omit<EmptyStateProps, 'icon' | 'title' | 'description'>) => (
    <EmptyState
      icon={Users}
      title="No people added"
      description="Add people to track transactions"
      {...props}
    />
  ),

  Error: (props: Omit<EmptyStateProps, 'variant' | 'title' | 'description'>) => (
    <EmptyState
      variant="error"
      title="Something went wrong"
      description="Please try again later"
      {...props}
    />
  ),
}