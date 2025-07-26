'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { formatDistanceToNow } from 'date-fns'
import { fr, enUS } from 'date-fns/locale'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { ImageViewer } from '@/components/ui/image-viewer'
import { AddItemModal, PersonModal } from '@/components/shared/modal-configurations'
import { cn } from '@/lib/utils'

interface InvoiceViewModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  invoiceItems: any[]
  invoiceData: {
    id: string
    invoice_number: string
    invoice_date: Date
    total_amount: number
    client?: {
      id: string
      name: string
      lastname?: string | null
    } | null
  }
  onRefresh?: () => void
}

export function InvoiceViewModal({
  open,
  onOpenChange,
  invoiceItems,
  invoiceData,
  onRefresh,
}: InvoiceViewModalProps) {
  const t = useTranslations()
  const router = useRouter()
  const locale = t('common.locale') === 'fr' ? fr : enUS
  const [viewingImageUrl, setViewingImageUrl] = useState<string | null>(null)
  const [viewingImageAlt, setViewingImageAlt] = useState<string>('')
  const [viewingItem, setViewingItem] = useState<any>(null)
  const [viewingClient, setViewingClient] = useState<boolean>(false)
  const [clientData, setClientData] = useState<any>(null)
  const [loadingClient, setLoadingClient] = useState<boolean>(false)

  const clientName = invoiceData.client
    ? `${invoiceData.client.name} ${invoiceData.client.lastname || ''}`.trim()
    : t('items.noClient')

  const clientInitials = invoiceData.client
    ? `${invoiceData.client.name[0]}${invoiceData.client.lastname?.[0] || ''}`.toUpperCase()
    : 'NC'

  // Function to fetch complete client data with invoices
  const handleClientClick = async () => {
    if (!invoiceData.client?.id) return

    setLoadingClient(true)
    try {
      const response = await fetch(`/api/people/${invoiceData.client.id}`)
      if (!response.ok) {
        throw new Error('Failed to fetch client data')
      }
      
      const completeClientData = await response.json()
      setClientData(completeClientData)
      setViewingClient(true)
    } catch (error) {
      console.error('Error fetching client data:', error)
      // Fallback to basic client data if fetch fails
      setClientData({
        id: invoiceData.client.id,
        name: invoiceData.client.name,
        lastname: invoiceData.client.lastname,
        invoices: []
      })
      setViewingClient(true)
    } finally {
      setLoadingClient(false)
    }
  }

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {t('items.invoice')} #{invoiceData.invoice_number}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            {/* Invoice Header */}
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <div 
                  className={cn(
                    "flex items-center gap-2 rounded-md p-2 transition-colors",
                    invoiceData.client ? "cursor-pointer hover:bg-muted/50" : "",
                    loadingClient ? "opacity-50" : ""
                  )}
                  onClick={handleClientClick}
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>{clientInitials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{clientName}</p>
                    <p className="text-sm text-muted-foreground">
                      {t('items.client')}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="text-right">
                <p className="text-sm text-muted-foreground">
                  {t('items.invoiceDate')}
                </p>
                <p className="font-medium">
                  {new Date(invoiceData.invoice_date).toLocaleDateString(locale.code)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(invoiceData.invoice_date), { 
                    addSuffix: true, 
                    locale 
                  })}
                </p>
              </div>
            </div>

            <Separator />

            {/* Items List */}
            <div>
              <h3 className="font-semibold mb-4">
                {t('items.itemsInInvoice')} ({invoiceItems.length})
              </h3>
              
              <div className="space-y-4">
                {invoiceItems.map((item) => (
                  <div 
                    key={item.id} 
                    className={cn(
                      "border rounded-lg p-4 cursor-pointer transition-colors",
                      "hover:bg-muted/50 hover:border-primary/20"
                    )}
                    onClick={() => setViewingItem(item)}
                  >
                    <div className="flex gap-4">
                      {/* Item Image */}
                      {item.primaryImage && (
                        <div 
                          className="w-20 h-20 rounded overflow-hidden cursor-pointer flex-shrink-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            setViewingImageUrl(item.primaryImage.url)
                            setViewingImageAlt(item.primaryImage.alt_text || item.item_number || '')
                          }}
                        >
                          <img
                            src={item.primaryImage.url}
                            alt={item.primaryImage.alt_text || item.item_number || ''}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      
                      {/* Item Details */}
                      <div className="flex-1 space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">
                              {item.item_number || t('items.noItemNumber')}
                            </p>
                            {item.description && (
                              <p className="text-sm text-muted-foreground">
                                {item.description}
                              </p>
                            )}
                          </div>
                          
                          <div className="text-right">
                            <p className="font-semibold text-green-600">
                              €{item.sale_price ? Number(item.sale_price).toFixed(2) : '0.00'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex gap-4 text-sm">
                          {item.category?.name && (
                            <Badge variant="outline">
                              {item.category.name}
                            </Badge>
                          )}
                          {item.color && (
                            <span className="text-muted-foreground">
                              {t('items.color')}: {item.color}
                            </span>
                          )}
                          {item.grade && (
                            <span className="text-muted-foreground">
                              {t('items.grade')}: {item.grade}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Total */}
            <div className="flex justify-between items-center">
              <p className="text-lg font-semibold">{t('items.total')}</p>
              <p className="text-2xl font-bold text-green-600">
                €{Number(invoiceData.total_amount).toFixed(2)}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Viewer */}
      <ImageViewer
        imageUrl={viewingImageUrl || ''}
        alt={viewingImageAlt}
        isOpen={!!viewingImageUrl}
        onClose={() => {
          setViewingImageUrl(null)
          setViewingImageAlt('')
        }}
      />

      {/* Item Details Modal */}
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
              clientId: invoiceData.client?.id || null,
              salePrice: viewingItem.sale_price?.toString() || undefined,
              saleDate: viewingItem.sale_date || null,
              saleLocation: viewingItem.sale_location || undefined,
              paymentMethod: viewingItem.payment_method || undefined
            },
            images: (() => {
              const originalImages = viewingItem.images || []
              console.log('Original images before sorting:', originalImages.map(img => ({
                id: img.id, 
                position: img.position, 
                is_primary: img.is_primary,
                created_at: img.created_at
              })))
              
              const sortedImages = originalImages
                .slice() // Create a copy to avoid mutating original array
                .sort((a: any, b: any) => {
                  // Sort by position asc, then is_primary desc, then created_at asc
                  // This matches the server-side primary image logic: position 0 first, then is_primary
                  const aPos = a.position == null ? 999 : Number(a.position)
                  const bPos = b.position == null ? 999 : Number(b.position)
                  
                  console.log(`Comparing: a(id: ${a.id}, pos: ${aPos}, primary: ${a.is_primary}) vs b(id: ${b.id}, pos: ${bPos}, primary: ${b.is_primary})`)
                  
                  if (aPos !== bPos) {
                    console.log(`Sorting by position: ${aPos} vs ${bPos} = ${aPos - bPos}`)
                    return aPos - bPos
                  }
                  if (a.is_primary !== b.is_primary) {
                    const result = b.is_primary ? 1 : -1
                    console.log(`Sorting by is_primary: ${a.is_primary} vs ${b.is_primary} = ${result}`)
                    return result
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
              
              console.log('Sorted images:', sortedImages.map(img => ({
                id: img.id, 
                position: img.position, 
                is_primary: img.is_primary,
                created_at: img.created_at
              })))
              
              return sortedImages
            })()
          }}
          categories={[]}
          open={!!viewingItem}
          onOpenChange={(open) => {
            if (!open) {
              setViewingItem(null)
              // Call refresh callback if provided to update the invoice data
              if (onRefresh) {
                onRefresh()
              }
            }
          }}
        />
      )}

      {/* Client Details Modal */}
      {viewingClient && clientData && (
        <PersonModal
          open={viewingClient}
          onOpenChange={(open) => {
            setViewingClient(open)
            if (!open) {
              setClientData(null)
            }
          }}
          person={clientData}
          personTypes={[]}
          mode="view"
        />
      )}
    </>
  )
}