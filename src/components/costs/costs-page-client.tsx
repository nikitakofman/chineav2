'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { format } from 'date-fns'
import { Plus, Calendar, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { CostEventTypesList } from './cost-event-types-list'
import { CostsList, CostEventTypesTable } from '@/components/shared/table-configurations'
import { CostsGrid } from '@/components/shared/grid-configurations'
import { GenericCrudModal, type FieldConfig, type GenericCrudModalConfig } from '@/components/shared/generic-crud-modal'
import { ConfirmationDialog } from '@/components/shared/confirmation-dialog'
import { 
  createCost, 
  createCostEventType, 
  updateCost, 
  deleteCost,
  updateCostEventType,
  deleteCostEventType 
} from '@/app/actions/costs'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { ViewToggle } from '@/components/ui/view-toggle'
import { useDefaultMobileView } from '@/hooks/use-default-mobile-view'
import { ViewContainer } from '@/components/ui/view-container'
import { useBook } from '@/contexts/book-context'

type PageCostEventType = {
  id: string
  name: string
  user_id: string | null
  created_at: Date | null
}

type PageCost = {
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

interface CostsPageClientProps {
  costEventTypes: PageCostEventType[]
  initialCosts: PageCost[]
}

export function CostsPageClient({ costEventTypes, initialCosts }: CostsPageClientProps) {
  const t = useTranslations()
  const router = useRouter()
  const { selectedBook } = useBook()
  const [showAddCostModal, setShowAddCostModal] = useState(false)
  const [showAddEventTypeModal, setShowAddEventTypeModal] = useState(false)
  const [selectedEventType, setSelectedEventType] = useState<string | null>(null)
  const [view, setView] = useDefaultMobileView('list')
  const [editingCost, setEditingCost] = useState<PageCost | null>(null)
  const [deletingCost, setDeletingCost] = useState<PageCost | null>(null)
  const [editingEventType, setEditingEventType] = useState<PageCostEventType | null>(null)
  const [deletingEventType, setDeletingEventType] = useState<PageCostEventType | null>(null)
  const [eventTypesList, setEventTypesList] = useState<PageCostEventType[]>(costEventTypes)
  const [showQuickAddEventType, setShowQuickAddEventType] = useState(false)

  // Calculate total costs for the current month
  const currentMonth = new Date().getMonth()
  const currentYear = new Date().getFullYear()
  const monthlyTotal = initialCosts
    .filter(cost => {
      const costDate = new Date(cost.date)
      return costDate.getMonth() === currentMonth && costDate.getFullYear() === currentYear
    })
    .reduce((sum, cost) => sum + cost.amount, 0)

  // Calculate total costs
  const totalCosts = initialCosts.reduce((sum, cost) => sum + cost.amount, 0)

  // Cost modal configuration
  const getCostModalConfig = (mode: 'create' | 'edit' = 'create'): GenericCrudModalConfig => {
    const eventTypeOptions = eventTypesList.map(et => ({
      value: et.id,
      label: et.name
    }))

    const fields: FieldConfig[] = [
      {
        name: 'eventTypeId',
        label: t('costs.eventType'),
        type: 'select',
        required: true,
        options: eventTypeOptions,
        placeholder: t('costs.selectEventType'),
        defaultValue: selectedEventType || '',
        customRender: (field, value, onChange) => (
          <div className="flex gap-2">
            <Select 
              value={value} 
              onValueChange={onChange}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder={field.placeholder} />
              </SelectTrigger>
              <SelectContent>
                {field.options?.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={() => setShowQuickAddEventType(true)}
              className="shrink-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        )
      },
      {
        name: 'amount',
        label: t('costs.amount'),
        type: 'number',
        required: true,
        placeholder: '0.00',
        validation: (value) => {
          const num = parseFloat(value)
          if (isNaN(num) || num <= 0) {
            return t('costs.amountMustBePositive')
          }
          return null
        }
      },
      {
        name: 'date',
        label: t('costs.date'),
        type: 'date',
        required: true,
        defaultValue: new Date().toISOString().split('T')[0]
      },
      {
        name: 'details',
        label: t('costs.details'),
        type: 'textarea',
        placeholder: t('costs.detailsPlaceholder'),
        required: false
      }
    ]

    return {
      title: mode === 'create' ? t('costs.addCost') : t('costs.editCost'),
      description: mode === 'create' ? t('costs.addCostDescription') : t('costs.editCostDescription'),
      icon: DollarSign,
      fields,
      submitLabel: mode === 'create' ? t('costs.add') : t('costs.save'),
      loadingLabel: mode === 'create' ? t('costs.adding') : t('costs.saving'),
      mode
    }
  }

  // Event type modal configuration
  const getEventTypeModalConfig = (mode: 'create' | 'edit' = 'create'): GenericCrudModalConfig => {
    const fields: FieldConfig[] = [
      {
        name: 'name',
        label: t('costs.eventTypeName'),
        type: 'text',
        required: true,
        placeholder: t('costs.eventTypeNamePlaceholder'),
        validation: (value) => {
          if (!value || value.trim().length < 2) {
            return t('costs.eventTypeNameTooShort')
          }
          return null
        }
      }
    ]

    return {
      title: mode === 'create' ? t('costs.addEventType') : t('costs.editEventType'),
      description: mode === 'create' ? t('costs.addEventTypeDescription') : t('costs.editEventTypeDescription'),
      icon: Calendar,
      fields,
      submitLabel: mode === 'create' ? t('costs.add') : t('costs.save'),
      loadingLabel: mode === 'create' ? t('costs.adding') : t('costs.saving'),
      mode
    }
  }

  // Cost handlers
  const handleEditCost = (cost: PageCost) => {
    setEditingCost(cost)
  }

  const handleDeleteCost = (cost: PageCost) => {
    setDeletingCost(cost)
  }

  const handleConfirmDeleteCost = async () => {
    if (!deletingCost) return

    try {
      const result = await deleteCost(deletingCost.id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(t('costs.costDeleted'))
        router.refresh()
      }
    } catch (error) {
      toast.error(t('costs.failedToDeleteCost'))
    } finally {
      setDeletingCost(null)
    }
  }

  // Event type handlers
  const handleEditEventType = (eventType: PageCostEventType) => {
    setEditingEventType(eventType)
  }

  const handleDeleteEventType = (eventType: PageCostEventType) => {
    setDeletingEventType(eventType)
  }

  const handleConfirmDeleteEventType = async () => {
    if (!deletingEventType) return

    try {
      const result = await deleteCostEventType(deletingEventType.id)
      if (result.error) {
        toast.error(result.error)
      } else {
        toast.success(t('costs.eventTypeDeleted'))
        router.refresh()
      }
    } catch (error) {
      toast.error(t('costs.failedToDeleteEventType'))
    } finally {
      setDeletingEventType(null)
    }
  }

  // Quick add handler for event types
  const handleQuickAddCost = (eventTypeId: string) => {
    setSelectedEventType(eventTypeId)
    setShowAddCostModal(true)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t('costs.title')}</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">{t('costs.subtitle')}</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <Button onClick={() => setShowAddEventTypeModal(true)} variant="outline" className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            <span className="sm:inline">{t('costs.addEventType')}</span>
          </Button>
          <Button onClick={() => setShowAddCostModal(true)} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            <span className="sm:inline">{t('costs.addCost')}</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('costs.totalCosts')}</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{totalCosts.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{t('costs.allTime')}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('costs.monthlyTotal')}</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€{monthlyTotal.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">{format(new Date(), 'MMMM yyyy')}</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('costs.eventTypes')}</CardTitle>
            <Plus className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{costEventTypes.length}</div>
            <p className="text-xs text-muted-foreground">{t('costs.totalEventTypes')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="costs" className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <TabsList className="w-full sm:w-auto">
            <TabsTrigger value="costs" className="flex-1 sm:flex-none">{t('costs.costs')}</TabsTrigger>
            <TabsTrigger value="event-types" className="flex-1 sm:flex-none">{t('costs.eventTypes')}</TabsTrigger>
          </TabsList>
          
          <ViewToggle view={view} onViewChange={setView} />
        </div>

        <TabsContent value="costs" className="space-y-4">
          <ViewContainer showToggle={false} view={view} onViewChange={setView}>
            {{
              list: <CostsList 
                costs={initialCosts.map(cost => ({
                  id: cost.id,
                  amount: cost.amount,
                  date: cost.date,
                  details: cost.details_message,
                  costs_event_type: {
                    id: cost.costs_event_type?.id || '',
                    name: cost.costs_event_type?.name || ''
                  },
                  book: cost.book ? {
                    id: cost.book.id,
                    reference: cost.book.reference || ''
                  } : undefined
                }))} 
                onEdit={(cost) => {
                  const pageCost = initialCosts.find(c => c.id === cost.id)
                  if (pageCost) handleEditCost(pageCost)
                }}
                onDelete={(cost) => {
                  const pageCost = initialCosts.find(c => c.id === cost.id)
                  if (pageCost) handleDeleteCost(pageCost)
                }}
              />,
              grid: <CostsGrid 
                costs={initialCosts} 
                costEventTypes={costEventTypes}
              />
            }}
          </ViewContainer>
        </TabsContent>

        <TabsContent value="event-types" className="space-y-4">
          <ViewContainer showToggle={false} view={view} onViewChange={setView}>
            {{
              list: <CostEventTypesTable 
                eventTypes={costEventTypes.map(et => ({
                  id: et.id,
                  name: et.name,
                  created_at: et.created_at || new Date()
                }))}
                onEdit={(eventType) => {
                  const pageEventType = costEventTypes.find(et => et.id === eventType.id)
                  if (pageEventType) handleEditEventType(pageEventType)
                }}
                onDelete={(eventType) => {
                  const pageEventType = costEventTypes.find(et => et.id === eventType.id)
                  if (pageEventType) handleDeleteEventType(pageEventType)
                }}
                onQuickAdd={handleQuickAddCost}
              />,
              grid: <CostEventTypesList 
                eventTypes={costEventTypes}
                onSelectEventType={(eventType) => {
                  setSelectedEventType(eventType.id)
                  setShowAddCostModal(true)
                }}
              />
            }}
          </ViewContainer>
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <GenericCrudModal
        open={showAddCostModal}
        onOpenChange={(open) => {
          setShowAddCostModal(open)
          if (!open) {
            setSelectedEventType(null)
          }
        }}
        config={getCostModalConfig('create')}
        onSubmit={async (data) => {
          if (!selectedBook?.id) {
            return { error: t('costs.noBookSelected') }
          }
          const result = await createCost({
            bookId: selectedBook.id,
            eventTypeId: data.eventTypeId,
            amount: parseFloat(data.amount),
            date: data.date,
            details: data.details
          })
          return result
        }}
        onSuccess={() => {
          setSelectedEventType(null)
          router.refresh()
        }}
      />

      {/* Quick Add Event Type Modal */}
      <GenericCrudModal
        open={showQuickAddEventType}
        onOpenChange={setShowQuickAddEventType}
        config={getEventTypeModalConfig('create')}
        onSubmit={async (data) => {
          const result = await createCostEventType(data.name)
          return result
        }}
        onSuccess={(result: any) => {
          // Add the new event type to the local list
          if (result.data) {
            const newEventType: PageCostEventType = {
              id: result.data.id,
              name: result.data.name,
              user_id: result.data.user_id,
              created_at: result.data.created_at
            }
            setEventTypesList(prev => [...prev, newEventType])
            setSelectedEventType(newEventType.id)
          }
          setShowQuickAddEventType(false)
        }}
      />

      <GenericCrudModal
        open={showAddEventTypeModal}
        onOpenChange={setShowAddEventTypeModal}
        config={getEventTypeModalConfig('create')}
        onSubmit={async (data) => {
          const result = await createCostEventType(data.name)
          return result
        }}
        onSuccess={() => {
          router.refresh()
        }}
      />

      {/* Edit Cost Modal */}
      {editingCost && (
        <GenericCrudModal
          open={!!editingCost}
          onOpenChange={(open) => {
            if (!open) setEditingCost(null)
          }}
          config={getCostModalConfig('edit')}
          initialData={{
            eventTypeId: editingCost.costs_event_type_id || '',
            amount: editingCost.amount.toString(),
            date: new Date(editingCost.date).toISOString().split('T')[0],
            details: editingCost.details_message || ''
          }}
          onSubmit={async (data) => {
            const result = await updateCost(
              editingCost.id,
              {
                eventTypeId: data.eventTypeId,
                amount: parseFloat(data.amount),
                date: data.date,
                details: data.details
              }
            )
            return result
          }}
          onSuccess={() => {
            setEditingCost(null)
            router.refresh()
          }}
        />
      )}

      {/* Edit Event Type Modal */}
      {editingEventType && (
        <GenericCrudModal
          open={!!editingEventType}
          onOpenChange={(open) => {
            if (!open) setEditingEventType(null)
          }}
          config={getEventTypeModalConfig('edit')}
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

      {/* Delete Cost Confirmation */}
      <ConfirmationDialog
        open={!!deletingCost}
        onOpenChange={(open) => {
          if (!open) setDeletingCost(null)
        }}
        config={{
          title: t('costs.deleteCost'),
          description: t('costs.deleteCostDescription', {
            amount: deletingCost ? `€${deletingCost.amount.toFixed(2)}` : '',
            date: deletingCost ? format(new Date(deletingCost.date), 'PPP') : ''
          }),
          confirmLabel: t('common.delete'),
          cancelLabel: t('common.cancel'),
          variant: 'destructive'
        }}
        onConfirm={async () => {
          await handleConfirmDeleteCost()
          return { success: true }
        }}
      />

      {/* Delete Event Type Confirmation */}
      <ConfirmationDialog
        open={!!deletingEventType}
        onOpenChange={(open) => {
          if (!open) setDeletingEventType(null)
        }}
        config={{
          title: t('costs.deleteEventType'),
          description: t('costs.deleteEventTypeDescription', {
            name: deletingEventType?.name || ''
          }),
          confirmLabel: t('common.delete'),
          cancelLabel: t('common.cancel'),
          variant: 'destructive'
        }}
        onConfirm={async () => {
          await handleConfirmDeleteEventType()
          return { success: true }
        }}
      />
    </div>
  )
}