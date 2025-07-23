'use client'

import { useState } from 'react'
import { Eye, DollarSign, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { useTranslations } from 'next-intl'
import { formatDistanceToNow } from 'date-fns'
import { fr, enUS } from 'date-fns/locale'
import { useLocale } from 'next-intl'
import { AddItemModal } from './add-item-modal'
import { SaleModal } from './sale-modal'
import { IncidentModal } from './incident-modal'
import { ImageViewer } from '@/components/ui/image-viewer'

interface ItemsGridProps {
  items: Array<{
    id: string
    item_number: string | null
    description: string | null
    color: string | null
    grade: string | null
    created_at: Date | null
    category: {
      id: string
      name: string
    } | null
    item_purchases: Array<{
      purchase_price: number | null
      purchase_date: Date | null
      person: {
        name: string
      } | null
    }>
    item_sales: Array<{
      sale_price: number | null
      sale_date: Date | null
      person: {
        name: string
      } | null
    }>
    item_locations: Array<{
      location_type: string | null
      location_details: string | null
    }>
    images?: Array<{
      id: string
      url: string
      file_name: string
      original_name: string
      is_primary: boolean
      alt_text?: string | null
      title?: string | null
    }>
    primaryImage?: {
      id: string
      url: string
      alt_text?: string | null
      title?: string | null
    } | null
    imageCount?: number
  }>
  categories?: Array<{
    id: string
    name: string
  }>
  onUpdate?: () => void
}

export function ItemsGrid({ items, categories = [], onUpdate }: ItemsGridProps) {
  const [viewingItem, setViewingItem] = useState<(typeof items)[0] | null>(null)
  const [sellingItem, setSellingItem] = useState<(typeof items)[0] | null>(null)
  const [reportingIncident, setReportingIncident] = useState<(typeof items)[0] | null>(null)
  const [selectedImage, setSelectedImage] = useState<{ url: string; alt?: string } | null>(null)
  const t = useTranslations()
  const locale = useLocale()
  const dateLocale = locale === 'fr' ? fr : enUS

  const getItemStatus = (item: typeof items[0]) => {
    if (item.item_sales.length > 0) {
      return { label: t('items.sold'), variant: 'secondary' as const }
    }
    return { label: t('items.available'), variant: 'success' as const }
  }

  const getLatestPrice = (item: typeof items[0]) => {
    if (item.item_purchases.length > 0) {
      return item.item_purchases[0].purchase_price
    }
    return null
  }

  if (items.length === 0) {
    return (
      <div className="bg-white dark:bg-card rounded-lg border border-border p-8">
        <div className="text-center">
          <p className="text-muted-foreground">{t('items.noItemsFound')}</p>
          <p className="text-sm text-muted-foreground mt-1">{t('items.addFirstItem')}</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {items.map((item) => {
          const status = getItemStatus(item)
          const price = getLatestPrice(item)

          return (
            <Card key={item.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <Badge variant={status.variant}>
                    {status.label}
                  </Badge>
                  <div className="text-sm text-muted-foreground">
                    {item.created_at
                      ? formatDistanceToNow(new Date(item.created_at), {
                          addSuffix: true,
                          locale: dateLocale,
                        })
                      : '-'}
                  </div>
                </div>
              </CardHeader>
              
              {/* Image Preview */}
              {item.primaryImage && (
                <div className="px-6 pb-4">
                  <div 
                    className="w-full h-32 bg-muted rounded-md overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => setSelectedImage({ 
                      url: item.primaryImage!.url, 
                      alt: item.primaryImage!.alt_text || item.primaryImage!.title || 'Item image' 
                    })}
                  >
                    <img
                      src={item.primaryImage.url}
                      alt={item.primaryImage.alt_text || item.primaryImage.title || 'Item image'}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder-image.png'
                      }}
                    />
                  </div>
                  {item.imageCount && item.imageCount > 1 && (
                    <div className="text-xs text-muted-foreground text-center mt-1">
                      +{item.imageCount - 1} more image{item.imageCount - 1 !== 1 ? 's' : ''}
                    </div>
                  )}
                </div>
              )}
              
              <CardContent className="pb-4">
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg truncate">
                    {item.item_number || 'No item number'}
                  </h3>
                  
                  <p className="text-sm text-muted-foreground line-clamp-2 min-h-[2.5rem]">
                    {item.description || 'No description'}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">{t('items.category')}:</span>
                      <br />
                      <span className="font-medium">{item.category?.name || '-'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">{t('items.purchasePrice')}:</span>
                      <br />
                      <span className="font-medium">{price ? `€${price.toFixed(2)}` : '-'}</span>
                    </div>
                  </div>
                  
                  {(item.color || item.grade) && (
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">{t('items.color')}:</span>
                        <br />
                        <span className="font-medium">{item.color || '-'}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">{t('items.grade')}:</span>
                        <br />
                        <span className="font-medium">{item.grade || '-'}</span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
              
              <CardFooter className="pt-0">
                <div className="flex gap-2 w-full">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 min-h-[44px] touch-manipulation"
                    onClick={() => setViewingItem(item)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  
                  {item.item_sales.length === 0 && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 min-h-[44px] touch-manipulation"
                      onClick={() => setSellingItem(item)}
                      title={t('items.markAsSold')}
                    >
                      <DollarSign className="h-4 w-4 mr-1" />
                      Sell
                    </Button>
                  )}
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="min-h-[44px] touch-manipulation"
                    onClick={() => setReportingIncident(item)}
                    title="Report Incident"
                  >
                    <AlertTriangle className="h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          )
        })}
      </div>
      
      {viewingItem && (
        <AddItemModal
          open={!!viewingItem}
          onOpenChange={(open) => !open && setViewingItem(null)}
          mode="view"
          item={{
            id: viewingItem.id,
            item_number: viewingItem.item_number,
            description: viewingItem.description,
            color: viewingItem.color,
            grade: viewingItem.grade,
            category_id: viewingItem.category?.id || null,
            category: viewingItem.category,
            item_purchases: viewingItem.item_purchases.map(p => ({
              purchase_price: p.purchase_price || null,
              purchase_date: p.purchase_date
            })),
            images: viewingItem.images || [],
            item_attributes: viewingItem.item_attributes || [],
            documents: viewingItem.documents || []
          }}
          categories={categories}
          onUpdate={onUpdate}
        />
      )}
      
      {sellingItem && (
        <SaleModal
          open={!!sellingItem}
          onOpenChange={(open) => !open && setSellingItem(null)}
          item={{
            id: sellingItem.id,
            item_number: sellingItem.item_number,
            description: sellingItem.description,
            color: sellingItem.color,
            grade: sellingItem.grade,
            category: sellingItem.category
          }}
        />
      )}
      
      {reportingIncident && (
        <IncidentModal
          open={!!reportingIncident}
          onOpenChange={(open) => !open && setReportingIncident(null)}
          item={{
            id: reportingIncident.id,
            item_number: reportingIncident.item_number,
            description: reportingIncident.description
          }}
        />
      )}
      
      {/* Image Viewer */}
      <ImageViewer
        imageUrl={selectedImage?.url || ''}
        alt={selectedImage?.alt}
        isOpen={!!selectedImage}
        onClose={() => setSelectedImage(null)}
      />
    </>
  )
}