'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Eye, FileDown, Package } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr, enUS } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { InvoiceViewModal } from '@/components/modals/invoice-view-modal'
import { AddItemModal } from '@/components/shared/modal-configurations'
import { EmptyState } from '@/components/shared/empty-state'

interface InvoiceGroup {
  id: string
  invoice_number: string
  invoice_date: Date
  total_amount: number
  client?: {
    id: string
    name: string
    lastname?: string | null
  } | null
  items: any[]
}

interface SoldItemsGroupedGridProps {
  invoiceGroups: InvoiceGroup[]
}

export function SoldItemsGroupedGrid({ invoiceGroups }: SoldItemsGroupedGridProps) {
  const t = useTranslations()
  const router = useRouter()
  const locale = t('common.locale') === 'fr' ? fr : enUS
  const [viewingInvoice, setViewingInvoice] = useState<{
    invoiceData: any
    items: any[]
  } | null>(null)
  const [viewingItem, setViewingItem] = useState<any>(null)

  const handleDownloadInvoice = async (invoiceId: string) => {
    try {
      const response = await fetch('/api/invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          invoiceId: invoiceId,
        }),
      })
      
      if (!response.ok) {
        throw new Error('Failed to generate invoice')
      }
      
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `invoice_${invoiceGroups.find(g => g.id === invoiceId)?.invoice_number || invoiceId}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Error downloading invoice:', error)
    }
  }

  const handleViewInvoice = (group: InvoiceGroup) => {
    setViewingInvoice({
      invoiceData: {
        id: group.id,
        invoice_number: group.invoice_number,
        invoice_date: group.invoice_date,
        total_amount: group.total_amount,
        client: group.client
      },
      items: group.items
    })
  }

  const handleRefreshInvoiceData = () => {
    // Refresh the page to get the latest data
    router.refresh()
  }

  if (invoiceGroups.length === 0) {
    return (
      <EmptyState
        icon={Package}
        title={t('items.noSoldItems')}
        description={t('items.noSoldItemsDescription')}
      />
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {invoiceGroups.map((group, groupIndex) => {
          const bgColor = groupIndex % 2 === 0 ? 'border-blue-200 bg-blue-50/50 dark:border-blue-800 dark:bg-blue-950/20' : 'border-gray-200 bg-gray-50/50 dark:border-gray-800 dark:bg-gray-950/20'
          const accentColor = groupIndex % 2 === 0 ? 'bg-blue-500' : 'bg-gray-500'
          
          // Determine grid layout based on number of items
          const itemCount = group.items.length
          let gridCols = 'grid-cols-1'
          if (itemCount === 2) gridCols = 'grid-cols-2'
          else if (itemCount === 3) gridCols = 'grid-cols-3'
          else if (itemCount >= 4) gridCols = 'grid-cols-2'
          
          const clientName = group.client
            ? `${group.client.name} ${group.client.lastname || ''}`.trim()
            : t('items.noClient')

          const clientInitials = group.client
            ? `${group.client.name[0]}${group.client.lastname?.[0] || ''}`.toUpperCase()
            : 'NC'

          return (
            <Card key={group.id} className={cn('overflow-hidden h-fit', bgColor)}>
              {/* Compact Header */}
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {/* Group indicator */}
                    <div className={`w-1 h-12 rounded-full ${accentColor} opacity-60`} />
                    
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="text-sm">{clientInitials}</AvatarFallback>
                    </Avatar>
                    
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-sm truncate">
                          {t('items.invoice')} #{group.invoice_number}
                        </h3>
                        <Badge variant="outline" className="text-xs">
                          {group.items.length}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{clientName}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Total */}
                    <div className="text-right">
                      <p className="text-sm font-bold text-green-600">
                        €{Number(group.total_amount).toFixed(2)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(group.invoice_date).toLocaleDateString(locale.code)}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleViewInvoice(group)}
                        title={t('items.viewInvoice')}
                        className="h-7 w-7 p-0"
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownloadInvoice(group.id)}
                        title={t('items.downloadInvoice')}
                        className="h-7 w-7 p-0"
                      >
                        <FileDown className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>

              {/* Compact Items Grid */}
              <CardContent className="pt-0">
                <div className={cn('grid gap-2', gridCols)}>
                  {group.items.map((item) => (
                    <div
                      key={item.id}
                      className={cn(
                        "relative rounded-lg overflow-hidden cursor-pointer transition-all duration-200",
                        "hover:shadow-md hover:scale-105 group"
                      )}
                      onClick={() => setViewingItem(item)}
                    >
                      {/* Item Image */}
                      <div className="aspect-square bg-muted">
                        {item.primaryImage ? (
                          <img
                            src={item.primaryImage.url}
                            alt={item.primaryImage.alt_text || item.item_number || ''}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Package className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                      </div>

                      {/* Overlay with price */}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all duration-200">
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                          <p className="text-white text-xs font-semibold">
                            €{item.sale_price ? Number(item.sale_price).toFixed(2) : '0.00'}
                          </p>
                          {item.item_number && (
                            <p className="text-white/80 text-xs line-clamp-1">
                              {item.item_number}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Modals */}
      {viewingInvoice && (
        <InvoiceViewModal
          open={!!viewingInvoice}
          onOpenChange={(open) => {
            if (!open) {
              setViewingInvoice(null)
            }
          }}
          invoiceItems={viewingInvoice.items}
          invoiceData={viewingInvoice.invoiceData}
          onRefresh={handleRefreshInvoiceData}
        />
      )}
      
      {viewingItem && (
        <AddItemModal
          mode="view"
          item={{
            id: viewingItem.id,
            itemNumber: viewingItem.item_number || '',
            description: viewingItem.description || '',
            categoryId: viewingItem.category?.id || null,
            category: viewingItem.category || null,
            color: viewingItem.color || undefined,
            grade: viewingItem.grade || undefined,
            customFields: {},
            purchase: viewingItem.item_purchases?.[0] ? {
              sellerId: viewingItem.item_purchases[0].person?.id || null,
              purchasePrice: viewingItem.item_purchases[0].purchase_price?.toString() || undefined,
              purchaseDate: viewingItem.item_purchases[0].purchase_date || null
            } : undefined,
            sale: {
              clientId: viewingItem.client?.id || null,
              salePrice: viewingItem.sale_price?.toString() || undefined,
              saleDate: viewingItem.sale_date || null,
              saleLocation: viewingItem.sale_location || undefined,
              paymentMethod: viewingItem.payment_method || undefined
            },
            images: (() => {
              const originalImages = viewingItem.images || []
              
              const sortedImages = originalImages
                .slice() // Create a copy to avoid mutating original array
                .sort((a: any, b: any) => {
                  // Sort by position asc, then is_primary desc, then created_at asc
                  const aPos = a.position == null ? 999 : Number(a.position)
                  const bPos = b.position == null ? 999 : Number(b.position)
                  
                  if (aPos !== bPos) {
                    return aPos - bPos
                  }
                  if (a.is_primary !== b.is_primary) {
                    return b.is_primary ? 1 : -1
                  }
                  return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
                })
                .map((img: any) => ({
                  id: img.id,
                  url: img.storage_url,
                  file_name: img.file_name,
                  file_size: Number(img.file_size) || null,
                  mime_type: img.mime_type,  
                  is_primary: img.is_primary,
                  position: img.position,
                  title: img.title,
                  alt_text: img.alt_text,
                  width: img.width,
                  height: img.height,
                  created_at: img.created_at
                }))
              
              return sortedImages
            })()
          }}
          categories={[]}
          open={!!viewingItem}
          onOpenChange={(open) => {
            if (!open) {
              setViewingItem(null)
              // Call refresh callback to update the grid data
              handleRefreshInvoiceData()
            }
          }}
        />
      )}
    </>
  )
}