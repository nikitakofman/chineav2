'use client'

import { useState } from 'react'
import { Eye, DollarSign, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useTranslations } from 'next-intl'
import { formatDistanceToNow } from 'date-fns'
import { fr, enUS } from 'date-fns/locale'
import { useLocale } from 'next-intl'
import { AddItemModal } from './add-item-modal'
import { SaleModal } from './sale-modal'
import { IncidentModal } from './incident-modal'
import { ImageViewer } from '@/components/ui/image-viewer'

interface ItemsTableProps {
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
    primaryImage?: {
      id: string
      url: string
      alt_text?: string | null
      title?: string | null
    } | null
    images?: Array<{
      id: string
      url: string
      file_name: string
      original_name: string
      is_primary: boolean
      alt_text?: string | null
      title?: string | null
    }>
    item_attributes: Array<{
      id: string
      field_definition_id: string
      value: string | null
    }>
    documents: Array<{
      id: string
      title: string
      original_name: string
      file_name: string
      file_path: string
      file_size: bigint | null
      mime_type: string | null
      storage_url: string | null
      description: string | null
      document_type: {
        id: string
        name: string
        description: string | null
      } | null
      created_at: Date | null
    }>
  }>
  categories?: Array<{
    id: string
    name: string
  }>
  onUpdate?: () => void
}

export function ItemsTable({ items, categories = [], onUpdate }: ItemsTableProps) {
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
    <div className="bg-white dark:bg-card rounded-lg border border-border">
      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <Table className="min-w-[800px]">
        <TableHeader>
          <TableRow>
            <TableHead className="w-[60px] text-muted-foreground">Image</TableHead>
            <TableHead className="text-muted-foreground">{t('items.itemNumber')}</TableHead>
            <TableHead className="text-muted-foreground">{t('items.description')}</TableHead>
            <TableHead className="text-muted-foreground">{t('items.category')}</TableHead>
            <TableHead className="text-muted-foreground">{t('items.color')}</TableHead>
            <TableHead className="text-muted-foreground">{t('items.grade')}</TableHead>
            <TableHead className="text-muted-foreground">{t('items.purchasePrice')}</TableHead>
            <TableHead className="text-muted-foreground">{t('items.status')}</TableHead>
            <TableHead className="text-muted-foreground">{t('items.addedDate')}</TableHead>
            <TableHead className="w-[100px] text-muted-foreground">{t('items.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const status = getItemStatus(item)
            const price = getLatestPrice(item)

            return (
              <TableRow key={item.id}>
                <TableCell>
                  {item.primaryImage ? (
                    <div 
                      className="w-10 h-10 bg-muted rounded overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
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
                  ) : (
                    <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                      <span className="text-xs text-muted-foreground">-</span>
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-medium">
                  {item.item_number || '-'}
                </TableCell>
                <TableCell>
                  <div className="max-w-[300px] truncate">
                    {item.description || '-'}
                  </div>
                </TableCell>
                <TableCell>
                  {item.category?.name || '-'}
                </TableCell>
                <TableCell>{item.color || '-'}</TableCell>
                <TableCell>{item.grade || '-'}</TableCell>
                <TableCell>
                  {price ? `€${price.toFixed(2)}` : '-'}
                </TableCell>
                <TableCell>
                  <Badge variant={status.variant}>
                    {status.label}
                  </Badge>
                </TableCell>
                <TableCell>
                  {item.created_at
                    ? formatDistanceToNow(new Date(item.created_at), {
                        addSuffix: true,
                        locale: dateLocale,
                      })
                    : '-'}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => setViewingItem(item)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {item.item_sales.length === 0 && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8"
                        onClick={() => setSellingItem(item)}
                        title={t('items.markAsSold')}
                      >
                        <DollarSign className="h-4 w-4" />
                      </Button>
                    )}
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8"
                      onClick={() => setReportingIncident(item)}
                      title="Report Incident"
                    >
                      <AlertTriangle className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
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
    </div>
  )
}