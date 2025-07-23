'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { useTranslations } from 'next-intl'
import { updateCategory } from '@/app/actions/categories'
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

interface EditCategoryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category: Category
  onCategoryUpdated: (category: Category) => void
}

export function EditCategoryModal({ open, onOpenChange, category, onCategoryUpdated }: EditCategoryModalProps) {
  const t = useTranslations()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)

    const formData = new FormData(event.currentTarget)
    const result = await updateCategory(category.id, formData)

    if (result.error) {
      toast.error(result.error)
    } else if (result.category) {
      toast.success(t('categories.categoryUpdatedSuccess'))
      onCategoryUpdated(result.category)
      onOpenChange(false)
      router.refresh()
    }

    setIsLoading(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('categories.editCategory')}</DialogTitle>
          <DialogDescription>
            {t('categories.editCategoryDescription')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">{t('categories.categoryName')}</Label>
              <Input
                id="name"
                name="name"
                defaultValue={category.name}
                placeholder={t('categories.categoryNamePlaceholder')}
                required
              />
            </div>
          </div>
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? t('common.saving') : t('common.save')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}