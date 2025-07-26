'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PeopleTable } from '@/components/shared/table-configurations'
import { PeopleGrid } from '@/components/shared/grid-configurations'
import { ViewToggle, ViewType } from '@/components/ui/view-toggle'
import { useDefaultMobileView } from '@/hooks/use-default-mobile-view'
import { PersonTypeSelectionDialog } from './person-type-selection-dialog'
import { AddPersonModal, PersonModal } from '@/components/shared/modal-configurations'

interface PersonType {
  id: string
  name: string
}

interface Person {
  id: string
  name: string
  lastname?: string | null
  person_type_id?: string | null
  address_line_1?: string | null
  address_line_2?: string | null
  zipcode?: string | null
  country?: string | null
  phone?: string | null
  website?: string | null
  specialization?: string | null
  created_at?: Date | null
  person_type?: PersonType | null
  item_purchases: { id: string }[]
  item_sales: { id: string }[]
  invoices?: {
    id: string
    invoice_number: string
    invoice_date: Date
    total_amount: number
    status: string
  }[]
  _count?: {
    item_purchases: number
    item_sales: number
    invoices: number
  }
}

interface PeoplePageClientProps {
  people: Person[]
  personTypes: PersonType[]
}

export function PeoplePageClient({ people, personTypes }: PeoplePageClientProps) {
  const [view, setView] = useDefaultMobileView('list')
  const [showTypeSelection, setShowTypeSelection] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null)
  const [editingPerson, setEditingPerson] = useState<Person | null>(null)
  const [showEditModal, setShowEditModal] = useState(false)
  const t = useTranslations()

  const handleSelectType = (typeId: string) => {
    setSelectedTypeId(typeId)
    setShowTypeSelection(false)
    setShowAddModal(true)
  }

  const handleAddPerson = () => {
    setShowTypeSelection(true)
  }

  const handleEditPerson = (person: Person) => {
    setEditingPerson(person)
    setShowEditModal(true)
  }

  const handleDeletePerson = async (person: Person) => {
    if (confirm(t('people.deletePersonConfirmation', { name: person.name }))) {
      try {
        const response = await fetch(`/api/people/${person.id}`, {
          method: 'DELETE',
        })
        
        if (response.ok) {
          window.location.reload()
        } else {
          console.error('Failed to delete person')
        }
      } catch (error) {
        console.error('Error deleting person:', error)
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t('people.title')}</h1>
          <p className="text-muted-foreground mt-1 text-sm sm:text-base">{t('people.subtitle')}</p>
        </div>
        <Button onClick={handleAddPerson} className="flex items-center gap-2 self-end">
          <Plus className="h-4 w-4" />
          <span className="sm:inline">{t('people.addPerson')}</span>
        </Button>
      </div>

      <div className="flex justify-center sm:justify-end">
        <ViewToggle view={view} onViewChange={setView} />
      </div>
      
      {view === 'list' ? (
        <PeopleTable 
          people={people} 
          onEdit={handleEditPerson}
          onDelete={handleDeletePerson}
        />
      ) : (
        <PeopleGrid people={people} personTypes={personTypes} />
      )}

      <PersonTypeSelectionDialog
        open={showTypeSelection}
        onOpenChange={setShowTypeSelection}
        personTypes={personTypes}
        onSelectType={handleSelectType}
      />

      <AddPersonModal
        open={showAddModal}
        onOpenChange={(open) => {
          setShowAddModal(open)
          if (!open) {
            setSelectedTypeId(null)
            window.location.reload()
          }
        }}
        personTypes={personTypes}
        preselectedTypeId={selectedTypeId}
      />

      {editingPerson && (
        <PersonModal
          open={showEditModal}
          onOpenChange={(open) => {
            setShowEditModal(open)
            if (!open) {
              setEditingPerson(null)
              window.location.reload()
            }
          }}
          personTypes={personTypes}
          person={editingPerson}
          mode="view"
        />
      )}
    </div>
  )
}