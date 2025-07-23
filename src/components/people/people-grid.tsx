'use client'

import { useState } from 'react'
import { Eye, Trash2, Edit, Phone, Globe, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { useTranslations } from 'next-intl'
import { formatDistanceToNow } from 'date-fns'
import { fr, enUS } from 'date-fns/locale'
import { useLocale } from 'next-intl'
import { PersonModal } from './person-modal'
import { DeletePersonDialog } from './delete-person-dialog'
import { getPersonTypeInfo } from '@/lib/person-type-utils'

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
}

interface PeopleGridProps {
  people: Person[]
  personTypes: PersonType[]
}

export function PeopleGrid({ people, personTypes }: PeopleGridProps) {
  const [viewingPerson, setViewingPerson] = useState<Person | null>(null)
  const [editingPerson, setEditingPerson] = useState<Person | null>(null)
  const [deletingPerson, setDeletingPerson] = useState<Person | null>(null)
  const t = useTranslations()
  const locale = useLocale()
  const dateLocale = locale === 'fr' ? fr : enUS

  const getPersonTypeTranslation = (typeName?: string | null) => {
    if (!typeName) return 'Unknown'
    const normalizedType = typeName.toLowerCase()
    
    switch (normalizedType) {
      case 'expert':
        return t('people.expert')
      case 'client':
        return t('people.client')
      case 'seller':
        return t('people.seller')
      default:
        return typeName.charAt(0).toUpperCase() + typeName.slice(1)
    }
  }

  const getPersonTypeBadgeVariant = (typeName?: string | null) => {
    if (!typeName) return 'outline'
    const normalizedType = typeName.toLowerCase()
    
    switch (normalizedType) {
      case 'expert':
        return 'secondary'
      case 'client':
        return 'default'
      case 'seller':
        return 'outline'
      default:
        return 'outline'
    }
  }

  if (people.length === 0) {
    return (
      <div className="bg-white dark:bg-card rounded-lg border border-border p-8">
        <div className="text-center">
          <p className="text-muted-foreground">{t('people.noPeopleFound')}</p>
          <p className="text-sm text-muted-foreground mt-1">{t('people.createFirstPerson')}</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {people.map((person) => {
          const typeInfo = getPersonTypeInfo(person.person_type?.name || '')
          const TypeIcon = typeInfo.icon
          const fullName = `${person.name} ${person.lastname || ''}`.trim()
          
          return (
            <Card key={person.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className={`p-2 ${typeInfo.color} text-white rounded-lg`}>
                    <TypeIcon className="h-5 w-5" />
                  </div>
                  <Badge variant={getPersonTypeBadgeVariant(person.person_type?.name) as any}>
                    {getPersonTypeTranslation(person.person_type?.name)}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="pb-4">
                <div className="space-y-3">
                  <div>
                    <h3 className="font-semibold text-lg truncate">
                      {fullName}
                    </h3>
                    {person.specialization && (
                      <p className="text-sm text-muted-foreground truncate">
                        {person.specialization}
                      </p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    {person.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="truncate">{person.phone}</span>
                      </div>
                    )}
                    
                    {person.website && (
                      <div className="flex items-center gap-2 text-sm">
                        <Globe className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                        <span className="truncate">{person.website}</span>
                      </div>
                    )}
                    
                    {(person.address_line_1 || person.country) && (
                      <div className="flex items-start gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <div className="truncate">
                          {person.address_line_1 && <div>{person.address_line_1}</div>}
                          {person.country && (
                            <div className="text-muted-foreground">
                              {person.zipcode && `${person.zipcode}, `}{person.country}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="pt-2 border-t text-xs text-muted-foreground">
                    <div>Purchases: {person.item_purchases.length}</div>
                    <div>Sales: {person.item_sales.length}</div>
                    {person.created_at && (
                      <div>
                        Added {formatDistanceToNow(new Date(person.created_at), {
                          addSuffix: true,
                          locale: dateLocale,
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
              
              <CardFooter className="pt-0">
                <div className="flex gap-2 w-full">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1"
                    onClick={() => setViewingPerson(person)}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setEditingPerson(person)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setDeletingPerson(person)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          )
        })}
      </div>
      
      {viewingPerson && (
        <PersonModal
          open={!!viewingPerson}
          onOpenChange={(open) => !open && setViewingPerson(null)}
          person={viewingPerson}
          personTypes={personTypes}
          mode="view"
        />
      )}
      
      {editingPerson && (
        <PersonModal
          open={!!editingPerson}
          onOpenChange={(open) => !open && setEditingPerson(null)}
          person={editingPerson}
          personTypes={personTypes}
          mode="create"
        />
      )}
      
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