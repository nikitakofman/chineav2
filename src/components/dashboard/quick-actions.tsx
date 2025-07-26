'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Plus, FileText, UserPlus } from 'lucide-react'
import { AddItemModal, AddPersonModal } from '@/components/shared/modal-configurations'
import { PersonTypeSelectionDialog } from '@/components/people/person-type-selection-dialog'
import { useRouter } from 'next/navigation'

interface QuickActionsProps {
  categories: any[]
  personTypes: any[]
  bookId: string
}

export function QuickActions({ categories, personTypes, bookId }: QuickActionsProps) {
  const t = useTranslations()
  const router = useRouter()
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false)
  const [showTypeSelection, setShowTypeSelection] = useState(false)
  const [showAddPersonModal, setShowAddPersonModal] = useState(false)
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null)

  const handleItemCreated = () => {
    setIsAddItemModalOpen(false)
    router.refresh()
  }

  const handlePersonCreated = () => {
    setShowAddPersonModal(false)
    setSelectedTypeId(null)
    router.refresh()
  }

  const handleSelectType = (typeId: string) => {
    setSelectedTypeId(typeId)
    setShowTypeSelection(false)
    setShowAddPersonModal(true)
  }

  return (
    <>
      <Card className="col-span-1 md:col-span-2 lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">{t('dashboard.quickActions')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <button
              onClick={() => setIsAddItemModalOpen(true)}
              className="w-full flex items-center space-x-3 p-3 rounded-lg border hover:bg-primary hover:text-primary-foreground cursor-pointer transition-colors group"
            >
              <Plus className="w-4 h-4 text-primary group-hover:text-primary-foreground" />
              <div className="text-left">
                <p className="text-sm font-medium group-hover:text-primary-foreground">{t('dashboard.addNewItem')}</p>
              </div>
            </button>
            
            <button
              onClick={() => setShowTypeSelection(true)}
              className="w-full flex items-center space-x-3 p-3 rounded-lg border hover:bg-primary hover:text-primary-foreground cursor-pointer transition-colors group"
            >
              <UserPlus className="w-4 h-4 text-blue-600 group-hover:text-primary-foreground" />
              <div className="text-left">
                <p className="text-sm font-medium group-hover:text-primary-foreground">{t('dashboard.addNewPerson')}</p>
              </div>
            </button>
            
            <a 
              href="/dashboard/incidents"
              className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-primary hover:text-primary-foreground cursor-pointer transition-colors group"
            >
              <FileText className="w-4 h-4 text-orange-600 group-hover:text-primary-foreground" />
              <div className="text-left">
                <p className="text-sm font-medium group-hover:text-primary-foreground">{t('dashboard.viewIncidents')}</p>
              </div>
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Add Item Modal */}
      <AddItemModal
        open={isAddItemModalOpen}
        onOpenChange={setIsAddItemModalOpen}
        categories={categories}
        bookId={bookId}
        onSuccess={handleItemCreated}
      />

      {/* Person Type Selection Dialog */}
      <PersonTypeSelectionDialog
        open={showTypeSelection}
        onOpenChange={setShowTypeSelection}
        personTypes={personTypes}
        onSelectType={handleSelectType}
      />

      {/* Add Person Modal */}
      <AddPersonModal
        open={showAddPersonModal}
        onOpenChange={(open) => {
          setShowAddPersonModal(open)
          if (!open) {
            setSelectedTypeId(null)
          }
        }}
        personTypes={personTypes}
        preselectedTypeId={selectedTypeId}
        onSuccess={handlePersonCreated}
      />
    </>
  )
}