'use client'

import { useState } from 'react'
import { CategoriesHeader } from './categories-header'
import { CategoriesTable } from './categories-table'
import { CategoriesGrid } from './categories-grid'
import { AddCategoryModal } from './add-category-modal'
import { EditCategoryModal } from './edit-category-modal'
import { DeleteCategoryDialog } from './delete-category-dialog'
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
  const [categories, setCategories] = useState(initialCategories)
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null)

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

      <AddCategoryModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onCategoryCreated={handleCategoryAdded}
      />

      {editingCategory && (
        <EditCategoryModal
          open={!!editingCategory}
          onOpenChange={(open) => !open && setEditingCategory(null)}
          category={editingCategory}
          onCategoryUpdated={handleCategoryUpdated}
        />
      )}

      {deletingCategory && (
        <DeleteCategoryDialog
          open={!!deletingCategory}
          onOpenChange={(open) => !open && setDeletingCategory(null)}
          category={deletingCategory}
          onCategoryDeleted={handleCategoryDeleted}
        />
      )}
    </>
  )
}