'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { DollarSign, X, Loader2 } from 'lucide-react'
import { createSale, getClients } from '@/app/actions/sales'

interface Client {
  id: string
  name: string
  lastname: string | null
}

interface Item {
  id: string
  item_number: string | null
  description: string | null
  color: string | null
  grade: string | null
  category: {
    name: string
  } | null
}

interface SaleModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: Item
}

export function SaleModal({ open, onOpenChange, item }: SaleModalProps) {
  const t = useTranslations()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [clients, setClients] = useState<Client[]>([])
  const [loadingClients, setLoadingClients] = useState(true)

  useEffect(() => {
    if (open) {
      loadClients()
    }
  }, [open])

  const loadClients = async () => {
    setLoadingClients(true)
    try {
      const clientsData = await getClients()
      setClients(clientsData)
    } catch (error) {
      console.error('Failed to load clients:', error)
    } finally {
      setLoadingClients(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    formData.append('item_id', item.id)

    try {
      const result = await createSale(formData)
      
      if (result.error) {
        setError(result.error)
      } else {
        onOpenChange(false)
        window.location.reload()
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  // Get today's date for default sale date
  const today = new Date().toISOString().split('T')[0]

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="!max-w-[calc(100vw-2rem)] w-[calc(100vw-2rem)] h-[90vh] p-0 
                   sm:!max-w-[calc(100vw-4rem)] sm:w-[calc(100vw-4rem)]"
        style={{ maxWidth: 'calc(100vw - 4rem)' }}>
        <div className="flex flex-col h-full">
          <DialogHeader className="px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-500 text-white rounded-lg">
                  <DollarSign className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-semibold">
                    {t('items.markAsSold')}
                  </DialogTitle>
                  <DialogDescription>
                    {t('items.saleDescription', 'Record the sale information for this item')}
                  </DialogDescription>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
            <ScrollArea className="flex-1">
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>{t('items.itemInformation', 'Item Information')}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label>{t('items.itemNumber')}</Label>
                          <div className="p-2 bg-muted rounded-md">
                            {item.item_number || '-'}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>{t('items.description')}</Label>
                          <div className="p-2 bg-muted rounded-md">
                            {item.description || '-'}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>{t('items.category')}</Label>
                            <div className="p-2 bg-muted rounded-md">
                              {item.category?.name || '-'}
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>{t('items.color')}</Label>
                            <div className="p-2 bg-muted rounded-md">
                              {item.color || '-'}
                            </div>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>{t('items.grade')}</Label>
                          <div className="p-2 bg-muted rounded-md">
                            {item.grade || '-'}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>{t('items.saleInformation', 'Sale Information')}</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="sale_price">{t('items.salePrice')} *</Label>
                          <Input
                            id="sale_price"
                            name="sale_price"
                            type="number"
                            step="0.01"
                            min="0"
                            placeholder="0.00"
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="sale_date">{t('items.saleDate')} *</Label>
                          <Input
                            id="sale_date"
                            name="sale_date"
                            type="date"
                            defaultValue={today}
                            required
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="client_id">{t('items.client', 'Client')}</Label>
                          {loadingClients ? (
                            <div className="flex items-center gap-2">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              <span className="text-sm text-muted-foreground">
                                {t('common.loading')}...
                              </span>
                            </div>
                          ) : (
                            <Select name="client_id">
                              <SelectTrigger>
                                <SelectValue placeholder={t('items.selectClient', 'Select a client (optional)')} />
                              </SelectTrigger>
                              <SelectContent>
                                {clients.map((client) => (
                                  <SelectItem key={client.id} value={client.id}>
                                    {client.name} {client.lastname || ''}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="payment_method">{t('items.paymentMethod', 'Payment Method')}</Label>
                          <Select name="payment_method">
                            <SelectTrigger>
                              <SelectValue placeholder={t('items.selectPaymentMethod', 'Select payment method (optional)')} />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="cash">{t('items.cash', 'Cash')}</SelectItem>
                              <SelectItem value="card">{t('items.card', 'Card')}</SelectItem>
                              <SelectItem value="check">{t('items.check', 'Check')}</SelectItem>
                              <SelectItem value="bank_transfer">{t('items.bankTransfer', 'Bank Transfer')}</SelectItem>
                              <SelectItem value="other">{t('items.other', 'Other')}</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="sale_location">{t('items.saleLocationLabel', 'Sale Location')}</Label>
                          <Input
                            id="sale_location"
                            name="sale_location"
                            placeholder={t('items.saleLocationPlaceholder', 'e.g., Store, Online, Fair')}
                          />
                        </div>
                      </CardContent>
                    </Card>

                    {error && (
                      <Alert variant="destructive">
                        <AlertDescription>{error}</AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>
              </div>
            </ScrollArea>

            <div className="px-6 py-4 border-t bg-gray-50 dark:bg-gray-900/50 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t('common.requiredFields')}</span>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isLoading}
                >
                  {t('common.cancel')}
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {t('items.recordSale', 'Record Sale')}
                </Button>
              </div>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}