'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Eye, FileDown } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { fr, enUS } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { InvoiceViewModal } from '@/components/modals/invoice-view-modal'
import { AddItemModal } from '@/components/shared/modal-configurations'
import { ImageViewer } from '@/components/ui/image-viewer'

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

interface SoldItemsGroupedTableProps {
  invoiceGroups: InvoiceGroup[]
}

export function SoldItemsGroupedTable({ invoiceGroups }: SoldItemsGroupedTableProps) {
  const t = useTranslations()
  const router = useRouter()
  const locale = t('common.locale') === 'fr' ? fr : enUS
  const [viewingInvoice, setViewingInvoice] = useState<{
    invoiceData: any
    items: any[]
  } | null>(null)
  const [viewingItem, setViewingItem] = useState<any>(null)
  const [viewingImageUrl, setViewingImageUrl] = useState<string | null>(null)
  const [viewingImageAlt, setViewingImageAlt] = useState<string>('')

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

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">{/* Group indicator */}</TableHead>
              <TableHead className="w-[100px]">{t('items.image')}</TableHead>
              <TableHead>{t('items.itemNumber')}</TableHead>
              <TableHead>{t('items.description')}</TableHead>
              <TableHead>{t('items.category')}</TableHead>
              <TableHead>{t('items.color')}</TableHead>
              <TableHead>{t('items.grade')}</TableHead>
              <TableHead className="text-right">{t('items.purchasePrice')}</TableHead>
              <TableHead className="text-right">{t('items.salePrice')}</TableHead>
              <TableHead>{t('items.soldTo')}</TableHead>
              <TableHead>{t('items.saleDate')}</TableHead>
              <TableHead className="text-right">{t('items.invoiceTotal')}</TableHead>
              <TableHead className="text-right">{t('common.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoiceGroups.map((group, groupIndex) => {
              const bgColor = groupIndex % 2 === 0 ? 'bg-blue-500' : 'bg-gray-500'
              const rowBgColor = groupIndex % 2 === 0 ? 'bg-blue-50/50 dark:bg-blue-950/20' : 'bg-gray-50/50 dark:bg-gray-950/20'
              
              return group.items.map((item, itemIndex) => {
                const isFirstInGroup = itemIndex === 0
                const isLastInGroup = itemIndex === group.items.length - 1
                const isSingleItem = group.items.length === 1

                return (
                  <TableRow 
                    key={item.id}
                    className={cn(
                      'relative',
                      rowBgColor,
                      !isLastInGroup && 'border-b-0'
                    )}
                  >
                    {/* Group indicator */}
                    <TableCell className="relative p-0">
                      <div className="absolute inset-0 flex justify-center">
                        {isSingleItem ? (
                          <div className={`w-2 h-8 mx-auto rounded-full ${bgColor} opacity-50 my-auto`} />
                        ) : (
                          <div 
                            className={`w-2 ${bgColor} opacity-50`}
                            style={{
                              height: isFirstInGroup || isLastInGroup ? 'calc(100% - 4px)' : '100%',
                              marginTop: isFirstInGroup ? '4px' : '0',
                              marginBottom: isLastInGroup ? '4px' : '0',
                              borderTopLeftRadius: isFirstInGroup ? '4px' : '0',
                              borderTopRightRadius: isFirstInGroup ? '4px' : '0',
                              borderBottomLeftRadius: isLastInGroup ? '4px' : '0',
                              borderBottomRightRadius: isLastInGroup ? '4px' : '0',
                            }}
                          />
                        )}
                      </div>
                    </TableCell>

                    {/* Image */}
                    <TableCell>
                      {item.primaryImage ? (
                        <div 
                          className="w-10 h-10 rounded overflow-hidden cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={(e) => {
                            e.stopPropagation()
                            setViewingImageUrl(item.primaryImage.url)
                            setViewingImageAlt(item.primaryImage.alt_text || item.item_number || '')
                          }}
                        >
                          <img
                            src={item.primaryImage.url}
                            alt={item.primaryImage.alt_text || item.item_number || ''}
                            className="w-full h-full object-cover pointer-events-none"
                          />
                        </div>
                      ) : (
                        <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                          <span className="text-xs text-muted-foreground">-</span>
                        </div>
                      )}
                    </TableCell>

                    {/* Item details */}
                    <TableCell className="font-medium">
                      {item.item_number || '-'}
                    </TableCell>
                    <TableCell>
                      <span className="line-clamp-1">
                        {item.description || '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {item.category?.name || '-'}
                    </TableCell>
                    <TableCell>{item.color || '-'}</TableCell>
                    <TableCell>{item.grade || '-'}</TableCell>
                    <TableCell className="text-right">
                      {item.item_purchases?.[0]?.purchase_price 
                        ? `€${Number(item.item_purchases[0].purchase_price).toFixed(2)}`
                        : '-'
                      }
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-medium text-green-600">
                        €{item.sale_price ? Number(item.sale_price).toFixed(2) : '0.00'}
                      </span>
                    </TableCell>

                    {/* Client (only show for first item) */}
                    <TableCell>
                      {isFirstInGroup && group.client ? (
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {`${group.client.name[0]}${group.client.lastname?.[0] || ''}`.toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span>
                            {`${group.client.name} ${group.client.lastname || ''}`.trim()}
                          </span>
                        </div>
                      ) : isFirstInGroup ? (
                        <span className="text-muted-foreground">-</span>
                      ) : null}
                    </TableCell>

                    {/* Sale date (only show for first item) */}
                    <TableCell>
                      {isFirstInGroup ? (
                        <div>
                          <p>{new Date(item.sale_date).toLocaleDateString(locale.code)}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(item.sale_date), { 
                              addSuffix: true, 
                              locale 
                            })}
                          </p>
                        </div>
                      ) : null}
                    </TableCell>

                    {/* Invoice total (only show for first item in multi-item groups) */}
                    <TableCell className="text-right">
                      {isFirstInGroup && group.items.length > 1 ? (
                        <div className="font-semibold text-green-600 dark:text-green-400">
                          €{Number(group.total_amount).toFixed(2)}
                        </div>
                      ) : null}
                    </TableCell>

                    {/* Actions (only show for first item) */}
                    <TableCell className="text-right">
                      {isFirstInGroup ? (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleViewInvoice(group)}
                            title={t('items.viewInvoice')}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDownloadInvoice(group.id)}
                            title={t('items.downloadInvoice')}
                          >
                            <FileDown className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : null}
                    </TableCell>
                  </TableRow>
                )
              })
            })}
          </TableBody>
        </Table>
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
              console.log('Grouped table - Original images before sorting:', originalImages.map(img => ({
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
                  
                  console.log(`Grouped table - Comparing: a(id: ${a.id}, pos: ${aPos}, primary: ${a.is_primary}) vs b(id: ${b.id}, pos: ${bPos}, primary: ${b.is_primary})`)
                  
                  if (aPos !== bPos) {
                    console.log(`Grouped table - Sorting by position: ${aPos} vs ${bPos} = ${aPos - bPos}`)
                    return aPos - bPos
                  }
                  if (a.is_primary !== b.is_primary) {
                    const result = b.is_primary ? 1 : -1
                    console.log(`Grouped table - Sorting by is_primary: ${a.is_primary} vs ${b.is_primary} = ${result}`)
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
              
              console.log('Grouped table - Sorted images:', sortedImages.map(img => ({
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
              router.refresh()
            }
          }}
        />
      )}

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
    </>
  )
}