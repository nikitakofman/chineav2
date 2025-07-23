'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, User, X } from 'lucide-react'
import { createPerson, updatePerson } from '@/app/actions/people'
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
  person_type?: PersonType | null
}

interface PersonModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  personTypes: PersonType[]
  person?: Person | null
  mode: 'create' | 'view'
  preselectedTypeId?: string | null
}

export function PersonModal({ open, onOpenChange, personTypes, person, mode, preselectedTypeId }: PersonModalProps) {
  const t = useTranslations()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isEditMode, setIsEditMode] = useState(mode === 'create')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    
    // Rename fields to match the expected format in the server action
    const submitData = new FormData()
    submitData.append('personTypeId', formData.get('person_type_id') as string)
    submitData.append('name', formData.get('name') as string)
    submitData.append('lastname', formData.get('lastname') as string || '')
    submitData.append('phone', formData.get('phone') as string || '')
    submitData.append('website', formData.get('website') as string || '')
    submitData.append('specialization', formData.get('specialization') as string || '')
    submitData.append('addressLine1', formData.get('address_line_1') as string || '')
    submitData.append('addressLine2', formData.get('address_line_2') as string || '')
    submitData.append('zipcode', formData.get('zipcode') as string || '')
    submitData.append('country', formData.get('country') as string || '')

    try {
      let result
      if (person && isEditMode) {
        result = await updatePerson(person.id, submitData)
      } else {
        result = await createPerson(submitData)
      }
      
      if (result.error) {
        setError(result.error)
      } else {
        onOpenChange(false)
        setIsEditMode(false)
        window.location.reload()
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const getPersonTypeTranslation = (typeName: string, withArticle = false) => {
    const normalizedType = typeName.toLowerCase()
    
    if (withArticle) {
      // For title with article (French: "un nouvel Expert")
      if (normalizedType === 'expert') return t('people.expertWithArticle')
      if (normalizedType === 'client') return t('people.clientWithArticle')
      if (normalizedType === 'seller') return t('people.sellerWithArticle')
    } else {
      // Regular translation
      if (normalizedType === 'expert') return t('people.expert')
      if (normalizedType === 'client') return t('people.client')
      if (normalizedType === 'seller') return t('people.seller')
    }
    
    return typeName.charAt(0).toUpperCase() + typeName.slice(1)
  }

  const isViewMode = mode === 'view' && !isEditMode

  // Get the person type info for coloring the icon
  const getPersonTypeForIcon = () => {
    if (person?.person_type?.name) {
      return person.person_type.name
    } else if (preselectedTypeId) {
      const selectedType = personTypes.find(t => t.id === preselectedTypeId)
      return selectedType?.name || ''
    }
    return ''
  }
  
  const personTypeForIcon = getPersonTypeForIcon()
  const typeInfo = getPersonTypeInfo(personTypeForIcon)
  const TypeIcon = typeInfo.icon

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="!max-w-[calc(100vw-2rem)] w-[calc(100vw-2rem)] h-[90vh] p-0 
                   sm:!max-w-[calc(100vw-4rem)] sm:w-[calc(100vw-4rem)]"
        style={{ maxWidth: 'calc(100vw - 4rem)' }}>
        <div className="flex flex-col h-full">
          <DialogHeader className="px-6 py-4 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 ${typeInfo.color} text-white rounded-lg`}>
                  <TypeIcon className="h-5 w-5" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-semibold">
                    {person && isViewMode 
                      ? person.name 
                      : person 
                        ? t('people.editPerson') 
                        : preselectedTypeId 
                          ? t('people.addNewPersonType', { 
                              type: getPersonTypeTranslation(
                                personTypes.find(t => t.id === preselectedTypeId)?.name || '',
                                true
                              ) 
                            })
                          : t('people.addNewPerson')
                    }
                  </DialogTitle>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {person && isViewMode && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditMode(true)}
                  >
                    {t('common.edit')}
                  </Button>
                )}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    onOpenChange(false)
                    setIsEditMode(mode === 'create')
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
            <ScrollArea className="flex-1">
              <div className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('people.personDetails')}</CardTitle>
                    <CardDescription>{t('common.requiredFields')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">{t('people.name')} *</Label>
                        <Input
                          id="name"
                          name="name"
                          placeholder={t('people.namePlaceholder')}
                          defaultValue={person?.name || ''}
                          required
                          disabled={isViewMode}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastname">{t('people.lastname')}</Label>
                        <Input
                          id="lastname"
                          name="lastname"
                          placeholder={t('people.lastnamePlaceholder')}
                          defaultValue={person?.lastname || ''}
                          disabled={isViewMode}
                        />
                      </div>
                    </div>

                    {/* Hidden input for person type */}
                    <input 
                      type="hidden" 
                      name="person_type_id" 
                      value={person?.person_type_id || preselectedTypeId || ''} 
                    />

                    <div className="space-y-2">
                      <Label htmlFor="specialization">{t('people.specialization')}</Label>
                      <Input
                        id="specialization"
                        name="specialization"
                        placeholder={t('people.specializationPlaceholder')}
                        defaultValue={person?.specialization || ''}
                        disabled={isViewMode}
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>{t('people.contactInformation')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="phone">{t('people.phone')}</Label>
                      <Input
                        id="phone"
                        name="phone"
                        type="tel"
                        placeholder={t('people.phonePlaceholder')}
                        defaultValue={person?.phone || ''}
                        disabled={isViewMode}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="website">{t('people.website')}</Label>
                      <Input
                        id="website"
                        name="website"
                        type="url"
                        placeholder={t('people.websitePlaceholder')}
                        defaultValue={person?.website || ''}
                        disabled={isViewMode}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('people.addressInformation')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="address_line_1">{t('people.addressLine1')}</Label>
                      <Input
                        id="address_line_1"
                        name="address_line_1"
                        placeholder={t('people.addressLine1Placeholder')}
                        defaultValue={person?.address_line_1 || ''}
                        disabled={isViewMode}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address_line_2">{t('people.addressLine2')}</Label>
                      <Input
                        id="address_line_2"
                        name="address_line_2"
                        placeholder={t('people.addressLine2Placeholder')}
                        defaultValue={person?.address_line_2 || ''}
                        disabled={isViewMode}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="zipcode">{t('people.zipcode')}</Label>
                        <Input
                          id="zipcode"
                          name="zipcode"
                          placeholder={t('people.zipcodePlaceholder')}
                          defaultValue={person?.zipcode || ''}
                          disabled={isViewMode}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="country">{t('people.country')}</Label>
                        <Input
                          id="country"
                          name="country"
                          placeholder={t('people.countryPlaceholder')}
                          defaultValue={person?.country || ''}
                          disabled={isViewMode}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                  </div>
                </div>
              </div>
            </ScrollArea>

            {!isViewMode && (
            <div className="px-6 py-4 border-t bg-gray-50 dark:bg-gray-900/50 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t('common.requiredFields')}</span>
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    onOpenChange(false)
                    setIsEditMode(mode === 'create')
                  }}
                  disabled={isLoading}
                >
                  {t('common.cancel')}
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {person ? t('people.updatePerson') : t('people.createPerson')}
                </Button>
              </div>
            </div>
            )}
          </form>
        </div>
      </DialogContent>
    </Dialog>
  )
}