'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Edit, Trash2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { EditCostEventTypeModal } from './edit-cost-event-type-modal'
import { DeleteCostEventTypeDialog } from './delete-cost-event-type-dialog'
import { format } from 'date-fns'

interface CostEventType {
  id: string
  name: string
  user_id: string | null
  created_at: Date | null
}

interface CostEventTypesTableProps {
  eventTypes: CostEventType[]
  onSelectEventType?: (eventType: CostEventType) => void
}

export function CostEventTypesTable({ eventTypes, onSelectEventType }: CostEventTypesTableProps) {
  const t = useTranslations()
  const [editingEventType, setEditingEventType] = useState<CostEventType | null>(null)
  const [deletingEventType, setDeletingEventType] = useState<CostEventType | null>(null)

  if (eventTypes.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Plus className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-lg font-semibold mb-2">{t('costs.noEventTypes')}</h3>
        <p className="text-muted-foreground">{t('costs.createFirstEventType')}</p>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <div className="overflow-x-auto">
          <Table className="min-w-[600px]">
          <TableHeader>
            <TableRow>
              <TableHead>{t('costs.eventType')}</TableHead>
              <TableHead>{t('costs.createdOn')}</TableHead>
              {onSelectEventType && <TableHead>Quick Action</TableHead>}
              <TableHead className="text-right">{t('common.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {eventTypes.map((eventType) => (
              <TableRow key={eventType.id}>
                <TableCell className="font-medium">{eventType.name}</TableCell>
                <TableCell>
                  {eventType.created_at ? format(new Date(eventType.created_at), 'PPP') : '-'}
                </TableCell>
                {onSelectEventType && (
                  <TableCell>
                    <Button 
                      variant="outline"
                      size="sm"
                      onClick={() => onSelectEventType(eventType)}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      {t('costs.addCostToType')}
                    </Button>
                  </TableCell>
                )}
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setEditingEventType(eventType)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setDeletingEventType(eventType)}
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

      {editingEventType && (
        <EditCostEventTypeModal
          open={!!editingEventType}
          onOpenChange={(open) => !open && setEditingEventType(null)}
          eventType={editingEventType}
        />
      )}

      {deletingEventType && (
        <DeleteCostEventTypeDialog
          open={!!deletingEventType}
          onOpenChange={(open) => !open && setDeletingEventType(null)}
          eventType={deletingEventType}
        />
      )}
    </>
  )
}