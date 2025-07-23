'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Edit, Trash2, Calendar, DollarSign, FileText, BookOpen } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
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

interface CostsGridProps {
  costs: Cost[]
  costEventTypes: CostEventType[]
}

export function CostsGrid({ costs, costEventTypes }: CostsGridProps) {
  const t = useTranslations()
  const [editingCost, setEditingCost] = useState<Cost | null>(null)
  const [deletingCost, setDeletingCost] = useState<Cost | null>(null)

  const getEventTypeBadgeVariant = (eventTypeName?: string | null) => {
    if (!eventTypeName) return 'outline'
    
    // You can customize these variants based on event type if needed
    const eventTypeColors: Record<string, string> = {
      'office supplies': 'default',
      'utilities': 'secondary',
      'travel': 'outline',
      'marketing': 'destructive',
    }
    
    return eventTypeColors[eventTypeName.toLowerCase()] || 'outline'
  }

  if (costs.length === 0) {
    return (
      <div className="bg-white dark:bg-card rounded-lg border border-border p-8">
        <div className="text-center">
          <DollarSign className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">{t('costs.noCosts')}</h3>
          <p className="text-muted-foreground">{t('costs.createFirstCost')}</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {costs.map((cost) => (
          <Card key={cost.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Badge variant={getEventTypeBadgeVariant(cost.costs_event_type?.name) as any}>
                  {cost.costs_event_type?.name || t('costs.noEventType')}
                </Badge>
                <div className="text-lg font-bold text-primary">
                  €{cost.amount.toFixed(2)}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pb-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 flex-shrink-0" />
                  <span>{format(new Date(cost.date), 'PPP')}</span>
                </div>
                
                {cost.book?.reference && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <BookOpen className="h-4 w-4 flex-shrink-0" />
                    <span>{cost.book.reference}</span>
                  </div>
                )}
                
                {cost.details_message && (
                  <div className="flex items-start gap-2 text-sm">
                    <FileText className="h-4 w-4 flex-shrink-0 mt-0.5 text-muted-foreground" />
                    <div className="line-clamp-3 min-h-[3.75rem]">
                      {cost.details_message}
                    </div>
                  </div>
                )}
                
                {!cost.details_message && (
                  <div className="min-h-[3.75rem] flex items-center justify-center text-muted-foreground text-sm">
                    No additional details
                  </div>
                )}
                
                {cost.created_at && (
                  <div className="pt-2 border-t text-xs text-muted-foreground">
                    Added {format(new Date(cost.created_at), 'PP')}
                  </div>
                )}
              </div>
            </CardContent>
            
            <CardFooter className="pt-0">
              <div className="flex gap-2 w-full">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1"
                  onClick={() => setEditingCost(cost)}
                >
                  <Edit className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setDeletingCost(cost)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>

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