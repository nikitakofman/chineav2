'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Plus, Eye, Trash2 } from 'lucide-react'
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
import { Badge } from '@/components/ui/badge'
import { AddPersonModal } from './add-person-modal'
import { DeletePersonDialog } from './delete-person-dialog'

interface PersonType {
  id: string
  name: string
}

interface Person {
  id: string
  name: string
  lastname: string | null
  phone: string | null
  person_type: PersonType | null
  address_line_1: string | null
  country: string | null
  created_at: Date | null
  item_purchases: { id: string }[]
  item_sales: { id: string }[]
}

interface PeopleTableProps {
  people: Person[]
  personTypes: PersonType[]
}

export function PeopleTable({ people, personTypes }: PeopleTableProps) {
  const t = useTranslations()
  const [viewingPerson, setViewingPerson] = useState<Person | null>(null)
  const [deletingPerson, setDeletingPerson] = useState<Person | null>(null)

  const getPersonTypeName = (type: string | null) => {
    if (!type) return null
    
    // Capitalize first letter and translate
    const typeKey = type.toLowerCase()
    const translationKey = `people.types.${typeKey}`
    
    // Check if translation exists, otherwise capitalize the original
    const translated = t(translationKey as any)
    if (translated === translationKey) {
      // Translation not found, capitalize first letter
      return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase()
    }
    return translated
  }

  if (people.length === 0) {
    return (
      <Card className="p-8 text-center">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Plus className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-lg font-semibold mb-2">{t('people.noPeopleFound')}</h3>
        <p className="text-muted-foreground">{t('people.createFirstPerson')}</p>
      </Card>
    )
  }

  return (
    <>
      <Card>
        <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
          <Table className="min-w-[700px]">
          <TableHeader>
            <TableRow>
              <TableHead className="text-muted-foreground">{t('people.name')}</TableHead>
              <TableHead className="text-muted-foreground">{t('people.type')}</TableHead>
              <TableHead className="text-muted-foreground">{t('people.phone')}</TableHead>
              <TableHead className="text-muted-foreground">{t('people.location')}</TableHead>
              <TableHead className="text-muted-foreground">{t('people.transactions')}</TableHead>
              <TableHead className="text-right text-muted-foreground">{t('common.actions')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {people.map((person) => {
              const fullName = [person.name, person.lastname].filter(Boolean).join(' ')
              const location = [person.address_line_1, person.country].filter(Boolean).join(', ')
              const transactionCount = person.item_purchases.length + person.item_sales.length
              
              return (
                <TableRow key={person.id}>
                  <TableCell className="font-medium">{fullName}</TableCell>
                  <TableCell>
                    {person.person_type && (
                      <Badge variant="outline">
                        {getPersonTypeName(person.person_type.name)}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>{person.phone || '-'}</TableCell>
                  <TableCell>{location || '-'}</TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {transactionCount > 0 ? transactionCount : '-'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setViewingPerson(person)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setDeletingPerson(person)}
                      disabled={transactionCount > 0}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
        </div>
      </Card>

      <AddPersonModal
        open={!!viewingPerson}
        onOpenChange={(open) => {
          if (!open) {
            setViewingPerson(null)
            window.location.reload()
          }
        }}
        personTypes={personTypes}
        mode="view"
        person={viewingPerson || undefined}
      />

      {deletingPerson && (
        <DeletePersonDialog
          open={!!deletingPerson}
          onOpenChange={(open) => !open && setDeletingPerson(null)}
          person={deletingPerson}
        />
      )}
    </>
  )
}