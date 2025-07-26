'use client'

import { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { LucideIcon } from 'lucide-react'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface ActionButton {
  label: string
  onClick: () => void
  icon?: LucideIcon
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'destructive'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  className?: string
}

interface QuickAction {
  label: string
  icon?: LucideIcon
  onClick: () => void
  className?: string
}

interface PageHeaderProps {
  title: string
  subtitle?: string
  icon?: LucideIcon
  breadcrumbs?: BreadcrumbItem[]
  actions?: ActionButton[]
  quickActions?: QuickAction[]
  children?: ReactNode
  className?: string
  titleClassName?: string
  subtitleClassName?: string
  separator?: string
  separatorText?: string
}

export function PageHeader({
  title,
  subtitle,
  icon: Icon,
  breadcrumbs,
  actions,
  quickActions,
  children,
  className,
  titleClassName,
  subtitleClassName,
  separator,
  separatorText,
}: PageHeaderProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <Breadcrumb>
          <BreadcrumbList>
            {breadcrumbs.map((item, index) => (
              <BreadcrumbItem key={index}>
                {index === breadcrumbs.length - 1 ? (
                  <BreadcrumbPage>{item.label}</BreadcrumbPage>
                ) : (
                  <>
                    <BreadcrumbLink href={item.href || '#'}>
                      {item.label}
                    </BreadcrumbLink>
                    <BreadcrumbSeparator />
                  </>
                )}
              </BreadcrumbItem>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      )}

      {/* Main Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1 sm:space-y-2">
          <h1 className={cn(
            'text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-3',
            titleClassName
          )}>
            {Icon && <Icon className="h-6 w-6 sm:h-8 sm:w-8" />}
            <span>
              {title}
              {separator && (
                <>
                  <span className="text-lg sm:text-xl font-normal text-muted-foreground mx-2">
                    {separator}
                  </span>
                  <span className="text-lg sm:text-xl font-normal text-muted-foreground">
                    {separatorText}
                  </span>
                </>
              )}
            </span>
          </h1>
          {subtitle && (
            <p className={cn(
              'text-muted-foreground text-sm sm:text-base',
              subtitleClassName
            )}>
              {subtitle}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Quick Actions */}
          {quickActions && quickActions.map((action, index) => (
            <Button
              key={index}
              variant="ghost"
              size="icon"
              onClick={action.onClick}
              className={cn('h-8 w-8 sm:h-10 sm:w-10', action.className)}
              aria-label={action.label}
            >
              {action.icon && <action.icon className="h-4 w-4 sm:h-5 sm:w-5" />}
            </Button>
          ))}

          {/* Main Actions */}
          {actions && actions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant || 'default'}
              size={action.size || 'default'}
              onClick={action.onClick}
              className={cn('flex items-center gap-2', action.className)}
            >
              {action.icon && <action.icon className="h-4 w-4" />}
              <span className="hidden sm:inline">{action.label}</span>
              {/* Show icon only on mobile if there's an icon */}
              {action.icon && <span className="sm:hidden" aria-label={action.label} />}
            </Button>
          ))}
        </div>
      </div>

      {/* Additional children content */}
      {children}
    </div>
  )
}