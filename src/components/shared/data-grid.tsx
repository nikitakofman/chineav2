'use client'

import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { ImageIcon } from 'lucide-react'
import { ImageViewer } from '@/components/ui/image-viewer'
import { useState } from 'react'
import Image from 'next/image'

// ============================================================================
// Types
// ============================================================================

export interface GridAction {
  label: string
  icon?: React.ComponentType<{ className?: string }>
  onClick: () => void
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  condition?: boolean
}

export interface GridBadge {
  label: string
  variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'success' | 'warning'
}

export interface GridImage {
  url: string
  alt: string
  count?: number
  onClick?: () => void
}

export interface EmptyStateConfig {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description?: string
}

export interface DataGridProps<T = any> {
  items: T[]
  renderCard: (item: T) => GridCardConfig
  keyExtractor?: (item: T) => string
  emptyState?: EmptyStateConfig
  gridClassName?: string
  cardClassName?: string
}

export interface GridCardConfig {
  header?: React.ReactNode
  badges?: GridBadge[]
  metadata?: React.ReactNode
  content: React.ReactNode
  footer?: React.ReactNode
  actions?: GridAction[]
  image?: GridImage
  className?: string
}

// ============================================================================
// Empty State Component
// ============================================================================

export function GridEmptyState({ icon: Icon, title, description }: EmptyStateConfig) {
  return (
    <div className="col-span-full">
      <div className="bg-white dark:bg-card rounded-lg border border-border p-8 text-center">
        <Icon className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
        <h3 className="text-lg font-semibold mb-1">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
    </div>
  )
}

// ============================================================================
// Grid Card Component
// ============================================================================

export function GridCard({
  header,
  badges = [],
  metadata,
  content,
  footer,
  actions = [],
  image,
  className
}: GridCardConfig) {
  const visibleActions = actions.filter(action => action.condition !== false)
  const [imageViewerOpen, setImageViewerOpen] = useState(false)

  return (
    <Card className={cn('hover:shadow-md transition-shadow', className)}>
      {(header || badges.length > 0 || metadata) && (
        <CardHeader className="pb-2">
          {(badges.length > 0 || metadata) && (
            <div className="flex justify-between items-start gap-2 mb-2">
              <div className="flex flex-wrap gap-2">
                {badges.map((badge, index) => (
                  <Badge key={index} variant={badge.variant}>
                    {badge.label}
                  </Badge>
                ))}
              </div>
              {metadata && (
                <div className="text-sm text-muted-foreground">
                  {metadata}
                </div>
              )}
            </div>
          )}
          {header}
        </CardHeader>
      )}

      <CardContent className="pt-2">
        {image && (
          <div className="mb-4">
            <button
              onClick={() => {
                if (image.onClick) {
                  image.onClick()
                } else {
                  setImageViewerOpen(true)
                }
              }}
              className="relative w-full aspect-square rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 hover:opacity-90 transition-opacity cursor-pointer"
            >
              <Image
                src={image.url || '/placeholder-image.svg'}
                alt={image.alt}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                loading="lazy"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src = '/placeholder-image.svg'
                }}
              />
              {image.count && image.count > 1 && (
                <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded-md text-sm flex items-center gap-1">
                  <ImageIcon className="w-3 h-3" />
                  {image.count}
                </div>
              )}
            </button>
            <ImageViewer
              imageUrl={image.url}
              alt={image.alt}
              isOpen={imageViewerOpen}
              onClose={() => setImageViewerOpen(false)}
            />
          </div>
        )}
        {content}
      </CardContent>

      {(footer || visibleActions.length > 0) && (
        <CardFooter className="pt-2 flex-col items-stretch gap-2">
          {footer}
          {visibleActions.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {visibleActions.map((action, index) => {
                const Icon = action.icon
                return (
                  <Button
                    key={index}
                    onClick={action.onClick}
                    variant={action.variant || 'outline'}
                    size={action.size || 'sm'}
                    className="flex-1 min-w-[100px]"
                  >
                    {Icon && <Icon className="w-4 h-4 mr-1" />}
                    {action.label}
                  </Button>
                )
              })}
            </div>
          )}
        </CardFooter>
      )}
    </Card>
  )
}

// ============================================================================
// Main Data Grid Component
// ============================================================================

export function DataGrid<T = any>({
  items,
  renderCard,
  keyExtractor,
  emptyState,
  gridClassName,
  cardClassName
}: DataGridProps<T>) {
  if (items.length === 0 && emptyState) {
    return (
      <div className={cn('grid grid-cols-1', gridClassName)}>
        <GridEmptyState {...emptyState} />
      </div>
    )
  }

  return (
    <div className={cn(
      'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4',
      gridClassName
    )}>
      {items.map((item, index) => {
        const key = keyExtractor ? keyExtractor(item) : index.toString()
        const cardConfig = renderCard(item)
        return (
          <GridCard
            key={key}
            {...cardConfig}
            className={cn(cardConfig.className, cardClassName)}
          />
        )
      })}
    </div>
  )
}