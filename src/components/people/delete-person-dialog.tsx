'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { deletePerson } from '@/app/actions/people'

interface Person {
  id: string
  name: string
  lastname: string | null
}

interface DeletePersonDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  person: Person
}

export function DeletePersonDialog({
  open,
  onOpenChange,
  person,
}: DeletePersonDialogProps) {
  const t = useTranslations()
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const result = await deletePerson(person.id)
      if (result.error) {
        console.error('Error deleting person:', result.error)
        setIsDeleting(false)
      } else {
        onOpenChange(false)
        window.location.reload()
      }
    } catch (error) {
      console.error('Error deleting person:', error)
      setIsDeleting(false)
    }
  }

  const fullName = [person.name, person.lastname].filter(Boolean).join(' ')

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('people.deletePerson')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('people.deletePersonConfirmation', { name: fullName })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>
            {t('common.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-red-600 hover:bg-red-700"
          >
            {isDeleting ? t('common.deleting') : t('common.delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}