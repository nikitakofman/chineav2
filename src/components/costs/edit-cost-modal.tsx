'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { updateCost } from '@/app/actions/costs'
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
import { Loader2 } from 'lucide-react'
import { format } from 'date-fns'

interface CostEventType {
  id: string
  name: string
}

interface Cost {
  id: string
  costs_event_type_id: string | null
  amount: number
  details_message: string | null
  date: Date
  book: {
    id: string
    reference: string | null
  } | null
}

interface EditCostModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cost: Cost
  costEventTypes: CostEventType[]
}

export function EditCostModal({ 
  open, 
  onOpenChange, 
  cost,
  costEventTypes
}: EditCostModalProps) {
  const t = useTranslations()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  const [eventTypeId, setEventTypeId] = useState(cost.costs_event_type_id || '')
  const [amount, setAmount] = useState(cost.amount.toString())
  const [date, setDate] = useState(format(new Date(cost.date), 'yyyy-MM-dd'))
  const [details, setDetails] = useState(cost.details_message || '')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const result = await updateCost(cost.id, {
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
      router.refresh()
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('costs.editCost')}</DialogTitle>
          <DialogDescription>
            {t('costs.editCostDescription')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {cost.book && (
            <div className="bg-muted p-3 rounded-lg">
              <p className="text-sm">
                <span className="text-muted-foreground">{t('costs.bookReference')}:</span>{' '}
                <span className="font-medium">{cost.book.reference}</span>
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
              disabled={isLoading || !eventTypeId || !amount}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('common.saving')}
                </>
              ) : (
                t('common.save')
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}