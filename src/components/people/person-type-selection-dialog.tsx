'use client'

import { useTranslations } from 'next-intl'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { getPersonTypeInfo } from '@/lib/person-type-utils'

interface PersonType {
  id: string
  name: string
}

interface PersonTypeSelectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  personTypes: PersonType[]
  onSelectType: (typeId: string) => void
}

export function PersonTypeSelectionDialog({
  open,
  onOpenChange,
  personTypes,
  onSelectType,
}: PersonTypeSelectionDialogProps) {
  const t = useTranslations()

  const getTypeInfo = (typeName: string) => {
    const typeInfo = getPersonTypeInfo(typeName)
    const normalizedType = typeName.toLowerCase()
    
    let title, description
    
    switch (normalizedType) {
      case 'expert':
        title = t('people.expert')
        description = t('people.expertDescription', 'Professionals who provide expertise and valuation services')
        break
      case 'client':
        title = t('people.client')
        description = t('people.clientDescription', 'Buyers and customers who purchase items')
        break
      case 'seller':
        title = t('people.seller')
        description = t('people.sellerDescription', 'Suppliers and vendors who sell items')
        break
      default:
        title = typeName.charAt(0).toUpperCase() + typeName.slice(1)
        description = ''
        break
    }
    
    return { ...typeInfo, title, description }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="!max-w-[calc(100vw-2rem)] w-[calc(100vw-2rem)] 
                   sm:!max-w-[calc(65vw)] sm:w-[calc(65vw)]
                   md:!max-w-[calc(60vw)] md:w-[calc(60vw)]"
        style={{ maxWidth: 'calc(60vw)' }}>
        <DialogHeader>
          <DialogTitle className="text-2xl">{t('people.selectPersonTypeTitle', 'What type of person would you like to add?')}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
          {personTypes.map((type) => {
            const typeInfo = getTypeInfo(type.name)
            const Icon = typeInfo.icon

            return (
              <Card
                key={type.id}
                className={`relative cursor-pointer transition-all duration-200 border-2 ${typeInfo.borderColor} ${typeInfo.hoverColor} hover:shadow-lg`}
                onClick={() => {
                  onSelectType(type.id)
                  onOpenChange(false)
                }}
              >
                <div className="p-6 text-center">
                  <div className={`mx-auto w-16 h-16 rounded-full ${typeInfo.lightColor} flex items-center justify-center mb-4`}>
                    <Icon className={`h-8 w-8 ${typeInfo.color} text-white p-1.5 rounded-full`} />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{typeInfo.title}</h3>
                </div>
              </Card>
            )
          })}
        </div>

        <div className="flex justify-end mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common.cancel')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}