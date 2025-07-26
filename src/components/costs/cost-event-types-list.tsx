'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Edit, Trash2, Plus, Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { GenericCrudModal, type FieldConfig, type GenericCrudModalConfig } from '@/components/shared/generic-crud-modal'
import { ConfirmationDialog, type ConfirmationDialogConfig } from '@/components/shared/confirmation-dialog'
import { updateCostEventType, deleteCostEventType } from '@/app/actions/costs'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'

interface CostEventType {
  id: string
  name: string
  user_id: string | null
  created_at: Date | null
}

interface CostEventTypesListProps {
  eventTypes: CostEventType[]
  onSelectEventType?: (eventType: CostEventType) => void
}

export function CostEventTypesList({ eventTypes, onSelectEventType }: CostEventTypesListProps) {
  const t = useTranslations()
  const router = useRouter()
  const [editingEventType, setEditingEventType] = useState<CostEventType | null>(null)
  const [deletingEventType, setDeletingEventType] = useState<CostEventType | null>(null)

  // Edit event type modal configuration
  const getEditEventTypeModalConfig = (eventType: CostEventType): GenericCrudModalConfig => {
    const fields: FieldConfig[] = [
      {
        name: 'name',
        label: t('costs.eventTypeName'),
        type: 'text',
        required: true,
        placeholder: t('costs.eventTypeNamePlaceholder'),
        defaultValue: eventType.name,
        validation: (value) => {
          if (!value || value.trim().length < 2) {
            return t('costs.eventTypeNameTooShort')
          }
          return null
        }
      }
    ]

    return {
      title: t('costs.editEventType'),
      description: t('costs.editEventTypeDescription'),
      icon: Calendar,
      fields,
      submitLabel: t('costs.save'),
      loadingLabel: t('costs.saving'),
      mode: 'edit'
    }
  }

  // Delete event type dialog configuration
  const getDeleteEventTypeDialogConfig = (eventType: CostEventType): ConfirmationDialogConfig => ({
    title: t('costs.deleteEventType'),
    description: t('costs.deleteEventTypeDescription', {
      name: eventType.name
    }),
    confirmLabel: t('common.delete'),
    cancelLabel: t('common.cancel'),
    variant: 'destructive',
    successMessage: t('costs.eventTypeDeleted'),
    errorMessage: t('costs.failedToDeleteEventType'),
    requireRefresh: true
  })

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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {eventTypes.map((eventType) => (
          <Card key={eventType.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{eventType.name}</CardTitle>
                <div className="flex gap-1">
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
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {t('costs.createdOn')} {eventType.created_at ? format(new Date(eventType.created_at), 'PPP') : ''}
              </p>
              {onSelectEventType && (
                <Button 
                  className="w-full mt-4" 
                  variant="outline"
                  onClick={() => onSelectEventType(eventType)}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  {t('costs.addCostToType')}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {editingEventType && (
        <GenericCrudModal
          open={!!editingEventType}
          onOpenChange={(open) => !open && setEditingEventType(null)}
          config={getEditEventTypeModalConfig(editingEventType)}
          initialData={{
            name: editingEventType.name
          }}
          onSubmit={async (data) => {
            const result = await updateCostEventType(editingEventType.id, data.name)
            return result
          }}
          onSuccess={() => {
            setEditingEventType(null)
            router.refresh()
          }}
        />
      )}

      {deletingEventType && (
        <ConfirmationDialog
          open={!!deletingEventType}
          onOpenChange={(open) => !open && setDeletingEventType(null)}
          config={getDeleteEventTypeDialogConfig(deletingEventType)}
          onConfirm={async () => {
            const result = await deleteCostEventType(deletingEventType.id)
            return result
          }}
          onSuccess={() => {
            setDeletingEventType(null)
          }}
        />
      )}
    </>
  )
}