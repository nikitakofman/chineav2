'use client'

import { useState } from 'react'
import { CategoriesHeader } from './categories-header'
import { CategoriesTable } from '@/components/shared/table-configurations'
import { CategoriesGrid } from '@/components/shared/grid-configurations'
import { GenericCrudModal } from '@/components/modals/generic-crud-modal'
import { ConfirmationDialog } from '@/components/shared/confirmation-dialog'
import { FieldConfig } from '@/types/form-types'
import { useTranslations } from 'next-intl'
import { toast } from 'sonner'
import { createCategory, updateCategory, deleteCategory } from '@/app/actions/categories'
import { useRouter } from 'next/navigation'
import { ViewContainer } from '@/components/ui/view-container'

interface Category {
  id: string
  name: string
  description: string | null
  user_id: string | null
  created_at: Date | null
  updated_at: Date | null
}

interface CategoriesPageClientProps {
  categories: Category[]
}

export function CategoriesPageClient({ categories: initialCategories }: CategoriesPageClientProps) {
  const t = useTranslations()
  const router = useRouter()
  const [categories, setCategories] = useState(initialCategories)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Field configuration for category forms
  const categoryFields: FieldConfig[] = [
    {
      id: 'name',
      name: 'name',
      label: t('categories.categoryName'),
      type: 'text',
      placeholder: t('categories.categoryNamePlaceholder'),
      validation: {
        required: true,
        minLength: 1,
        maxLength: 100
      }
    },
    {
      id: 'description',
      name: 'description',
      label: t('categories.description'),
      type: 'textarea',
      placeholder: t('categories.descriptionPlaceholder'),
      validation: {
        maxLength: 500
      }
    }
  ]

  const handleCategoryAdded = (newCategory: Category) => {
    setCategories([...categories, newCategory].sort((a, b) => a.name.localeCompare(b.name)))
  }

  const handleCategoryUpdated = (updatedCategory: Category) => {
    setCategories(categories.map(cat => 
      cat.id === updatedCategory.id ? updatedCategory : cat
    ).sort((a, b) => a.name.localeCompare(b.name)))
  }

  const handleCategoryDeleted = (categoryId: string) => {
    setCategories(categories.filter(cat => cat.id !== categoryId))
  }

  // Handle create category
  const handleCreateCategory = async (data: Record<string, any>) => {
    setIsSubmitting(true)
    try {
      const result = await createCategory(data.name, data.description)
      if (result.error) {
        toast.error(result.error)
        return { success: false, error: result.error }
      }
      if (result.category) {
        handleCategoryAdded(result.category)
        toast.success(t('categories.createCategory') + ' ' + t('common.success'))
        setShowAddModal(false)
        router.refresh()
        return { success: true, data: result.category }
      }
      return { success: false, error: 'Failed to create category' }
    } catch (error) {
      toast.error(t('common.error'))
      return false
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle update category
  const handleUpdateCategory = async (data: Record<string, any>) => {
    if (!editingCategory) return { success: false, error: 'No category to update' }
    setIsSubmitting(true)
    try {
      const result = await updateCategory(editingCategory.id, data.name, data.description)
      if (result.error) {
        toast.error(result.error)
        return { success: false, error: result.error }
      }
      if (result.category) {
        handleCategoryUpdated(result.category)
        toast.success(t('categories.categoryUpdatedSuccess'))
        setEditingCategory(null)
        router.refresh()
        return { success: true, data: result.category }
      }
      return { success: false, error: 'Failed to update category' }
    } catch (error) {
      toast.error(t('common.error'))
      return false
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle delete category
  const handleDeleteCategory = async () => {
    if (!deletingCategory) return
    setIsSubmitting(true)
    try {
      const result = await deleteCategory(deletingCategory.id)
      if (result.error) {
        toast.error(result.error)
        return
      }
      handleCategoryDeleted(deletingCategory.id)
      toast.success(t('categories.categoryDeletedSuccess'))
      setDeletingCategory(null)
      router.refresh()
    } catch (error) {
      toast.error(t('common.error'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <CategoriesHeader onAddClick={() => setShowAddModal(true)} />
      
      <div className="mt-6">
        <ViewContainer>
          {{
            list: <CategoriesTable 
              categories={categories}
              onEdit={setEditingCategory}
              onDelete={setDeletingCategory}
            />,
            grid: <CategoriesGrid 
              categories={categories}
              onEdit={setEditingCategory}
              onDelete={setDeletingCategory}
            />
          }}
        </ViewContainer>
      </div>

      {/* Add Category Modal */}
      <GenericCrudModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        mode="create"
        title={t('categories.addNewCategory')}
        description={t('categories.addCategoryDescription')}
        fields={categoryFields}
        data={{}}
        onSubmit={handleCreateCategory}
        loading={isSubmitting}
      />

      {/* Edit Category Modal */}
      {editingCategory && (
        <GenericCrudModal
          open={!!editingCategory}
          onOpenChange={(open) => !open && setEditingCategory(null)}
          mode="edit"
          title={t('categories.editCategory')}
          description={t('categories.editCategoryDescription')}
          fields={categoryFields}
          data={editingCategory}
          onSubmit={handleUpdateCategory}
          loading={isSubmitting}
        />
      )}

      {/* Delete Category Dialog */}
      {deletingCategory && (
        <ConfirmationDialog
          open={!!deletingCategory}
          onOpenChange={(open) => !open && setDeletingCategory(null)}
          title={t('categories.deleteCategory')}
          description={t('categories.deleteCategoryConfirmation', { name: deletingCategory.name })}
          confirmText={t('common.delete')}
          variant="destructive"
          onConfirm={handleDeleteCategory}
          loading={isSubmitting}
        />
      )}
    </>
  )
}