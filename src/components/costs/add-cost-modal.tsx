'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useBook } from '@/contexts/book-context'
import { createCost } from '@/app/actions/costs'
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
import { Loader2, Plus } from 'lucide-react'
import { format } from 'date-fns'

interface CostEventType {
  id: string
  name: string
}

interface AddCostModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  costEventTypes: CostEventType[]
  defaultEventTypeId?: string | null
}

export function AddCostModal({ 
  open, 
  onOpenChange, 
  costEventTypes,
  defaultEventTypeId 
}: AddCostModalProps) {
  const t = useTranslations()
  const router = useRouter()
  const { selectedBook } = useBook()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [eventTypeId, setEventTypeId] = useState(defaultEventTypeId || '')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [details, setDetails] = useState('')

  useEffect(() => {
    if (defaultEventTypeId) {
      setEventTypeId(defaultEventTypeId)
    }
  }, [defaultEventTypeId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!selectedBook) {
      setError(t('costs.noBookSelected'))
      return
    }

    setIsLoading(true)
    setError(null)

    const result = await createCost({
      bookId: selectedBook.id,
      eventTypeId,
      amount: parseFloat(amount),
      date,
      details: details.trim() || undefined
    })
    
    if (result.error) {
      setError(result.error)
      setIsLoading(false)
    } else {
      onOpenChange(false)
      // Reset form
      setEventTypeId('')
      setAmount('')
      setDate(format(new Date(), 'yyyy-MM-dd'))
      setDetails('')
      router.refresh()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('costs.addCost')}</DialogTitle>
          <DialogDescription>
            {t('costs.addCostDescription')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {selectedBook && (
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm">
                <span className="text-muted-foreground">{t('costs.bookReference')}:</span>{' '}
                <span className="font-medium">{selectedBook.reference}</span>
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="eventType">
              {t('costs.eventType')}
              <span className="text-destructive ml-1">*</span>
            </Label>
            <Select
              value={eventTypeId}
              onValueChange={setEventTypeId}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder={t('costs.selectEventType')} />
              </SelectTrigger>
              <SelectContent>
                {costEventTypes.map((eventType) => (
                  <SelectItem key={eventType.id} value={eventType.id}>
                    {eventType.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">
                {t('costs.amount')} (€)
                <span className="text-destructive ml-1">*</span>
              </Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">
                {t('costs.date')}
                <span className="text-destructive ml-1">*</span>
              </Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="details">{t('costs.details')}</Label>
            <Textarea
              id="details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder={t('costs.detailsPlaceholder')}
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              {t('common.cancel')}
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || !eventTypeId || !amount || !selectedBook}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('costs.creating')}
                </>
              ) : (
                <>
                  {t('common.add')}
                  <Plus className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}