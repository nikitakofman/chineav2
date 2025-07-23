'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Edit, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { EditCostModal } from './edit-cost-modal'
import { DeleteCostDialog } from './delete-cost-dialog'
import { format } from 'date-fns'

interface CostEventType {
  id: string
  name: string
}

interface Cost {
  id: string
  user_id: string | null
  book_id: string | null
  costs_event_type_id: string | null
  amount: number
  details_message: string | null
  date: Date
  created_at: Date | null
  costs_event_type: {
    id: string
    name: string
  } | null
  book: {
    id: string
    reference: string | null
  } | null
}

interface CostsListProps {
  costs: Cost[]
  costEventTypes: CostEventType[]
}

export function CostsList({ costs, costEventTypes }: CostsListProps) {
  const t = useTranslations()
  const [editingCost, setEditingCost] = useState<Cost | null>(null)
  const [deletingCost, setDeletingCost] = useState<Cost | null>(null)

  if (costs.length === 0) {
    return (
      <Card className="p-8 text-center">
        <h3 className="text-lg font-semibold mb-2">{t('costs.noCosts')}</h3>
        <p className="text-muted-foreground">{t('costs.createFirstCost')}</p>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <div className="overflow-x-auto">
          <Table className="min-w-[800px]">
          <TableHeader>
            <TableRow>
              <TableHead>{t('costs.date')}</TableHead>
              <TableHead>{t('costs.eventType')}</TableHead>
              <TableHead>{t('costs.amount')}</TableHead>
              <TableHead>{t('costs.details')}</TableHead>
              <TableHead>{t('costs.book')}</TableHead>
              <TableHead className="text-right">{t('common.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {costs.map((cost) => (
              <TableRow key={cost.id}>
                <TableCell>{format(new Date(cost.date), 'PPP')}</TableCell>
                <TableCell>
                  <Badge variant="outline">
                    {cost.costs_event_type?.name || t('costs.noEventType')}
                  </Badge>
                </TableCell>
                <TableCell className="font-medium">€{cost.amount.toFixed(2)}</TableCell>
                <TableCell className="max-w-[200px] truncate">
                  {cost.details_message || '-'}
                </TableCell>
                <TableCell>
                  {cost.book?.reference || t('costs.noBook')}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setEditingCost(cost)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setDeletingCost(cost)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          </Table>
        </div>
      </Card>

      {editingCost && (
        <EditCostModal
          open={!!editingCost}
          onOpenChange={(open) => !open && setEditingCost(null)}
          cost={editingCost}
          costEventTypes={costEventTypes}
        />
      )}

      {deletingCost && (
        <DeleteCostDialog
          open={!!deletingCost}
          onOpenChange={(open) => !open && setDeletingCost(null)}
          cost={deletingCost}
        />
      )}
    </>
  )
}