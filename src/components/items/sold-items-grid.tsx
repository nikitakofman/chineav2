'use client'

import { Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { useTranslations } from 'next-intl'
import { formatDistanceToNow } from 'date-fns'
import { fr, enUS } from 'date-fns/locale'
import { useLocale } from 'next-intl'

interface SoldItemsGridProps {
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
    item_images: Array<{
      id: string
      url: string
      file_name: string
      is_primary: boolean | null
    }>
  }>
  categories?: Array<{
    id: string
    name: string
  }>
  onUpdate?: () => void
}

export function SoldItemsGrid({ items, onUpdate }: SoldItemsGridProps) {
  const t = useTranslations()
  const locale = useLocale()
  const dateLocale = locale === 'fr' ? fr : enUS

  const getLatestSale = (item: typeof items[0]) => {
    if (item.item_sales.length > 0) {
      return item.item_sales[0] // Items are sorted by sale_date desc
    }
    return null
  }

  const getLatestPurchasePrice = (item: typeof items[0]) => {
    if (item.item_purchases.length > 0) {
      return item.item_purchases[0].purchase_price
    }
    return null
  }

  if (items.length === 0) {
    return (
      <div className="bg-white dark:bg-card rounded-lg border border-border p-8">
        <div className="text-center">
          <p className="text-muted-foreground">{t('items.noSoldItems')}</p>
          <p className="text-sm text-muted-foreground mt-1">{t('items.noSoldItemsDescription')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {items.map((item) => {
        const latestSale = getLatestSale(item)
        const purchasePrice = getLatestPurchasePrice(item)

        return (
          <Card key={item.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Badge variant="secondary">
                  {t('items.sold')}
                </Badge>
                <div className="text-sm text-muted-foreground">
                  {latestSale?.sale_date
                    ? formatDistanceToNow(new Date(latestSale.sale_date), {
                        addSuffix: true,
                        locale: dateLocale,
                      })
                    : '-'}
                </div>
              </div>
            </CardHeader>
            
            {/* Image Preview */}
            {item.item_images && item.item_images.length > 0 && (
              <div className="px-6 pb-4">
                <div className="w-full h-32 bg-muted rounded-md overflow-hidden">
                  <img
                    src={item.item_images[0].url}
                    alt={item.item_images[0].file_name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = '/placeholder-image.png'
                    }}
                  />
                </div>
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
                    <span className="text-muted-foreground">Sale Price:</span>
                    <br />
                    <span className="font-medium text-green-600">
                      {latestSale?.sale_price ? `€${latestSale.sale_price.toFixed(2)}` : '-'}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Purchase:</span>
                    <br />
                    <span className="font-medium">
                      {purchasePrice ? `€${purchasePrice.toFixed(2)}` : '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Profit:</span>
                    <br />
                    <span className="font-medium text-blue-600">
                      {latestSale?.sale_price && purchasePrice
                        ? `€${(latestSale.sale_price - purchasePrice).toFixed(2)}`
                        : '-'}
                    </span>
                  </div>
                </div>
                
                {latestSale?.person && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">{t('items.soldTo')}:</span>
                    <br />
                    <span className="font-medium">{latestSale.person.name}</span>
                  </div>
                )}
                
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
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full"
                onClick={() => {
                  // TODO: Open item details modal
                  console.log('View sold item:', item.id)
                }}
              >
                <Eye className="h-4 w-4 mr-1" />
                View Details
              </Button>
            </CardFooter>
          </Card>
        )
      })}
    </div>
  )
}