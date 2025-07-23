'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { deleteCost } from '@/app/actions/costs'
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'
import { format } from 'date-fns'

interface Cost {
  id: string
  amount: number
  date: Date
  costs_event_type: {
    name: string
  } | null
}

interface DeleteCostDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  cost: Cost
}

export function DeleteCostDialog({ 
  open, 
  onOpenChange, 
  cost 
}: DeleteCostDialogProps) {
  const t = useTranslations()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDelete = async () => {
    setIsLoading(true)
    setError(null)

    const result = await deleteCost(cost.id)
    
    if (result.error) {
      setError(result.error)
      setIsLoading(false)
    } else {
      onOpenChange(false)
      router.refresh()
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('costs.deleteCost')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('costs.deleteCostConfirmation', { 
              amount: `€${cost.amount.toFixed(2)}`,
              type: cost.costs_event_type?.name || t('costs.noEventType'),
              date: format(new Date(cost.date), 'PPP')
            })}
          </AlertDialogDescription>
        </AlertDialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <AlertDialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            {t('common.cancel')}
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('common.deleting')}
              </>
            ) : (
              t('common.delete')
            )}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}