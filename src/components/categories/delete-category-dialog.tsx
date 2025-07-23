'use client'

import { useState } from 'react'
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
import { useTranslations } from 'next-intl'
import { deleteCategory } from '@/app/actions/categories'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface Category {
  id: string
  name: string
  description: string | null
  user_id: string | null
  created_at: Date | null
  updated_at: Date | null
}

interface DeleteCategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category: Category
  onCategoryDeleted: (categoryId: string) => void
}

export function DeleteCategoryDialog({ open, onOpenChange, category, onCategoryDeleted }: DeleteCategoryDialogProps) {
  const t = useTranslations()
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)

  async function handleDelete() {
    setIsDeleting(true)

    const result = await deleteCategory(category.id)

    if (result.error) {
      toast.error(result.error)
    } else {
      toast.success(t('categories.categoryDeletedSuccess'))
      onCategoryDeleted(category.id)
      onOpenChange(false)
      router.refresh()
    }

    setIsDeleting(false)
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t('categories.deleteCategory')}</AlertDialogTitle>
          <AlertDialogDescription>
            {t('categories.deleteCategoryConfirmation', { name: category.name })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? t('common.deleting') : t('common.delete')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}