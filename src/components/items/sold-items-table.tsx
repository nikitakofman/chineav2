'use client'

import { useState } from 'react'
import { Eye } from 'lucide-react'
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

interface SoldItemsTableProps {
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
      sale_location: string | null
      payment_method: string | null
      person: {
        name: string
      } | null
    }>
    item_locations: Array<{
      location_type: string | null
      location_details: string | null
    }>
  }>
  categories?: Array<{
    id: string
    name: string
  }>
}

export function SoldItemsTable({ items, categories = [] }: SoldItemsTableProps) {
  const [viewingItem, setViewingItem] = useState<(typeof items)[0] | null>(null)
  const t = useTranslations()
  const locale = useLocale()
  const dateLocale = locale === 'fr' ? fr : enUS

  const getLatestPurchasePrice = (item: typeof items[0]) => {
    if (item.item_purchases.length > 0) {
      return item.item_purchases[0].purchase_price
    }
    return null
  }

  const getLatestSale = (item: typeof items[0]) => {
    if (item.item_sales.length > 0) {
      return item.item_sales[0]
    }
    return null
  }

  if (items.length === 0) {
    return (
      <div className="bg-white dark:bg-card rounded-lg border border-border p-8">
        <div className="text-center">
          <p className="text-muted-foreground">{t('items.noSoldItems', 'No sold items found')}</p>
          <p className="text-sm text-muted-foreground mt-1">{t('items.noSoldItemsDescription', 'Items will appear here once they have been sold')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-card rounded-lg border border-border">
      <div className="overflow-x-auto">
        <Table className="min-w-[1000px]">
        <TableHeader>
          <TableRow>
            <TableHead className="text-muted-foreground">{t('items.itemNumber')}</TableHead>
            <TableHead className="text-muted-foreground">{t('items.description')}</TableHead>
            <TableHead className="text-muted-foreground">{t('items.category')}</TableHead>
            <TableHead className="text-muted-foreground">{t('items.color')}</TableHead>
            <TableHead className="text-muted-foreground">{t('items.grade')}</TableHead>
            <TableHead className="text-muted-foreground">{t('items.purchasePrice')}</TableHead>
            <TableHead className="text-muted-foreground">{t('items.salePrice')}</TableHead>
            <TableHead className="text-muted-foreground">{t('items.soldTo', 'Sold To')}</TableHead>
            <TableHead className="text-muted-foreground">{t('items.saleDate')}</TableHead>
            <TableHead className="w-[70px] text-muted-foreground">{t('items.actions')}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const purchasePrice = getLatestPurchasePrice(item)
            const sale = getLatestSale(item)

            return (
              <TableRow key={item.id}>
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
                  {purchasePrice ? `€${purchasePrice.toFixed(2)}` : '-'}
                </TableCell>
                <TableCell>
                  {sale?.sale_price ? (
                    <span className="font-medium text-green-600">
                      €{sale.sale_price.toFixed(2)}
                    </span>
                  ) : '-'}
                </TableCell>
                <TableCell>
                  {sale?.person?.name || '-'}
                </TableCell>
                <TableCell>
                  {sale?.sale_date
                    ? formatDistanceToNow(new Date(sale.sale_date), {
                        addSuffix: true,
                        locale: dateLocale,
                      })
                    : '-'}
                </TableCell>
                <TableCell>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => setViewingItem(item)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
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
            }))
          }}
          categories={categories}
        />
      )}
    </div>
  )
}