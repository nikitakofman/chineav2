'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Plus, Calendar, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { CostEventTypesList } from './cost-event-types-list'
import { CostEventTypesTable } from './cost-event-types-table'
import { CostsList } from './costs-list'
import { CostsGrid } from './costs-grid'
import { AddCostModal } from './add-cost-modal'
import { AddCostEventTypeModal } from './add-cost-event-type-modal'
import { ViewToggle, ViewType } from '@/components/ui/view-toggle'
import { useDefaultMobileView } from '@/hooks/use-default-mobile-view'
import { ViewContainer } from '@/components/ui/view-container'
import { format } from 'date-fns'

interface CostEventType {
  id: string
  name: string
  user_id: string | null
  created_at: Date | null
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

interface CostsPageClientProps {
  costEventTypes: CostEventType[]
  initialCosts: Cost[]
}

export function CostsPageClient({ costEventTypes, initialCosts }: CostsPageClientProps) {
  const t = useTranslations()
  const [showAddCostModal, setShowAddCostModal] = useState(false)
  const [showAddEventTypeModal, setShowAddEventTypeModal] = useState(false)
  const [selectedEventType, setSelectedEventType] = useState<string | null>(null)
  const [view, setView] = useDefaultMobileView('list')

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
                costs={initialCosts} 
                costEventTypes={costEventTypes}
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
                eventTypes={costEventTypes}
                onSelectEventType={(eventType) => {
                  setSelectedEventType(eventType.id)
                  setShowAddCostModal(true)
                }}
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
      <AddCostModal
        open={showAddCostModal}
        onOpenChange={setShowAddCostModal}
        costEventTypes={costEventTypes}
        defaultEventTypeId={selectedEventType}
      />

      <AddCostEventTypeModal
        open={showAddEventTypeModal}
        onOpenChange={setShowAddEventTypeModal}
      />
    </div>
  )
}