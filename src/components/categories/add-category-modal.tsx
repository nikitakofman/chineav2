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
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, FolderPlus } from 'lucide-react'
import { createCategory } from '@/app/actions/categories'

interface AddCategoryModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCategoryCreated: (category: { id: string; name: string }) => void
}

export function AddCategoryModal({ open, onOpenChange, onCategoryCreated }: AddCategoryModalProps) {
  const t = useTranslations()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [categoryName, setCategoryName] = useState('')

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const result = await createCategory(categoryName)
      
      if (result.error) {
        setError(result.error)
      } else if (result.category) {
        onCategoryCreated(result.category)
        setCategoryName('')
        onOpenChange(false)
      }
    } catch {
      setError(t('common.error'))
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
              <FolderPlus className="w-5 h-5 text-primary" />
            </div>
            <div>
              <DialogTitle>{t('categories.addNewCategory')}</DialogTitle>
              <DialogDescription>
                {t('categories.addCategoryDescription')}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-4">
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="categoryName">
                {t('categories.categoryName')}
                <span className="text-destructive ml-1">*</span>
              </Label>
              <Input
                id="categoryName"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder={t('categories.categoryNamePlaceholder')}
                required
                autoFocus
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => {
                setCategoryName('')
                setError(null)
                onOpenChange(false)
              }}
            >
              {t('common.cancel')}
            </Button>
            <Button type="submit" disabled={isLoading || !categoryName.trim()}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {t('categories.creating')}
                </>
              ) : (
                <>
                  {t('categories.createCategory')}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}