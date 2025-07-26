# Migration Guide: Reusable Component System

This guide documents the migration from individual modal components to a unified, reusable component system using `GenericCrudModal` and `ConfirmationDialog`.

## Overview

The migration introduces two main reusable components:
- **GenericCrudModal**: A configurable modal for Create/Update operations
- **ConfirmationDialog**: A reusable confirmation dialog for delete operations

Additionally, all server actions have been migrated to use the centralized `EntityService`.

## Table of Contents

1. [GenericCrudModal Usage](#genericcrudmodal-usage)
2. [ConfirmationDialog Usage](#confirmationdialog-usage)
3. [Server Actions Migration](#server-actions-migration)
4. [Migration Examples](#migration-examples)
5. [Best Practices](#best-practices)
6. [Deprecated Components](#deprecated-components)

## GenericCrudModal Usage

### Configuration Structure

```typescript
interface GenericCrudModalConfig {
  title: string
  description?: string
  icon?: LucideIcon
  fields: FieldConfig[]
  submitLabel: string
  loadingLabel: string
  mode: 'create' | 'edit'
}

interface FieldConfig {
  name: string
  label: string
  type: 'text' | 'textarea' | 'select' | 'number' | 'email' | 'date'
  placeholder?: string
  required?: boolean
  options?: Array<{ value: string; label: string }>
  validation?: (value: any) => string | null
  defaultValue?: any
}
```

### Basic Usage Example

```typescript
import { GenericCrudModal } from '@/components/shared/generic-crud-modal'
import { FolderPlus } from 'lucide-react'

const addCategoryConfig: GenericCrudModalConfig = {
  title: t('categories.addNewCategory'),
  description: t('categories.addCategoryDescription'),
  icon: FolderPlus,
  mode: 'create',
  submitLabel: t('categories.createCategory'),
  loadingLabel: t('categories.creating'),
  fields: [
    {
      name: 'name',
      label: t('categories.categoryName'),
      type: 'text',
      placeholder: t('categories.categoryNamePlaceholder'),
      required: true,
      validation: (value: string) => {
        if (!value || !value.trim()) {
          return t('categories.categoryNameRequired')
        }
        return null
      }
    }
  ]
}

<GenericCrudModal
  open={showModal}
  onOpenChange={setShowModal}
  config={addCategoryConfig}
  onSubmit={handleSubmit}
  onSuccess={handleSuccess}
/>
```

## ConfirmationDialog Usage

### Configuration Structure

```typescript
interface ConfirmationDialogConfig {
  title: string
  description: string
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'destructive'
  successMessage?: string
  errorMessage?: string
  requireRefresh?: boolean
}
```

### Basic Usage Example

```typescript
import { ConfirmationDialog } from '@/components/shared/confirmation-dialog'

const deleteConfig: ConfirmationDialogConfig = {
  title: t('categories.deleteCategory'),
  description: t('categories.deleteCategoryConfirmation', { name: category.name }),
  confirmLabel: t('common.delete'),
  cancelLabel: t('common.cancel'),
  variant: 'destructive',
  successMessage: t('categories.categoryDeletedSuccess'),
  requireRefresh: true
}

<ConfirmationDialog
  open={showDialog}
  onOpenChange={setShowDialog}
  config={deleteConfig}
  onConfirm={handleDelete}
  onSuccess={handleSuccess}
/>
```

## Server Actions Migration

### Before (Direct Prisma Usage)

```typescript
export async function createCategory(name: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return { error: 'Not authenticated' }
  
  try {
    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        user_id: user.id
      }
    })
    
    revalidatePath('/dashboard/categories')
    return { success: true, category }
  } catch (error) {
    return { error: 'Failed to create category' }
  }
}
```

### After (EntityService Usage)

```typescript
export async function createCategory(name: string) {
  const result = await EntityService.create('category', {
    name: name.trim()
  }, {
    revalidatePaths: ['/dashboard/categories', '/dashboard/items']
  })
  
  if (!result.success) {
    return { 
      error: result.validationErrors?.[0] || result.error || 'Failed to create category' 
    }
  }
  
  return { category: result.data }
}
```

## Migration Examples

### Example 1: Migrating AddCategoryModal

**Before:**
```typescript
// add-category-modal.tsx
export function AddCategoryModal({ open, onOpenChange, onCategoryCreated }) {
  const [categoryName, setCategoryName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)
    const result = await createCategory(categoryName)
    // ... handle result
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <Input value={categoryName} onChange={(e) => setCategoryName(e.target.value)} />
          {/* ... rest of form */}
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

**After:**
```typescript
// categories-page-client.tsx
const addCategoryConfig: GenericCrudModalConfig = {
  title: t('categories.addNewCategory'),
  icon: FolderPlus,
  mode: 'create',
  submitLabel: t('categories.createCategory'),
  loadingLabel: t('categories.creating'),
  fields: [{
    name: 'name',
    label: t('categories.categoryName'),
    type: 'text',
    required: true
  }]
}

const handleAddCategory = async (data) => {
  const result = await createCategory(data.name)
  return result.error ? { error: result.error } : { success: true, data: result.category }
}

<GenericCrudModal
  open={showAddModal}
  onOpenChange={setShowAddModal}
  config={addCategoryConfig}
  onSubmit={handleAddCategory}
/>
```

### Example 2: Migrating DeleteCategoryDialog

**Before:**
```typescript
// delete-category-dialog.tsx
export function DeleteCategoryDialog({ open, onOpenChange, category, onCategoryDeleted }) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    setIsDeleting(true)
    const result = await deleteCategory(category.id)
    // ... handle result
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {/* ... dialog content */}
    </AlertDialog>
  )
}
```

**After:**
```typescript
// categories-page-client.tsx
const deleteCategoryConfig: ConfirmationDialogConfig = {
  title: t('categories.deleteCategory'),
  description: t('categories.deleteCategoryConfirmation', { name: category.name }),
  variant: 'destructive',
  successMessage: t('categories.categoryDeletedSuccess'),
  requireRefresh: true
}

const handleDeleteCategory = async () => {
  const result = await deleteCategory(deletingCategory.id)
  return result.error ? { error: result.error } : { success: true }
}

<ConfirmationDialog
  open={!!deletingCategory}
  onOpenChange={(open) => !open && setDeletingCategory(null)}
  config={deleteCategoryConfig}
  onConfirm={handleDeleteCategory}
/>
```

## Best Practices

### 1. Field Validation

Always provide validation for critical fields:

```typescript
fields: [{
  name: 'email',
  label: 'Email',
  type: 'email',
  required: true,
  validation: (value) => {
    if (!value.includes('@')) {
      return 'Invalid email address'
    }
    return null
  }
}]
```

### 2. Dynamic Configuration

Create configuration functions for dynamic content:

```typescript
const getDeleteConfig = (item: Item): ConfirmationDialogConfig => ({
  title: t('items.deleteItem'),
  description: t('items.deleteConfirmation', { name: item.name }),
  variant: 'destructive'
})
```

### 3. Error Handling

Always handle both success and error cases:

```typescript
const handleSubmit = async (data) => {
  const result = await createItem(data)
  
  if (result.error) {
    return { error: result.error }
  }
  
  // Update local state
  setItems([...items, result.data])
  return { success: true, data: result.data }
}
```

### 4. Type Safety

Define interfaces for your data:

```typescript
interface Category {
  id: string
  name: string
  description: string | null
}

interface CategoriesPageProps {
  categories: Category[]
}
```

## Deprecated Components

The following components should be replaced with the new reusable system:

### Category Components (Deprecated)
- `/src/components/categories/add-category-modal.tsx` → Use `GenericCrudModal`
- `/src/components/categories/edit-category-modal.tsx` → Use `GenericCrudModal`
- `/src/components/categories/delete-category-dialog.tsx` → Use `ConfirmationDialog`

### Cost Components (Deprecated)
- `/src/components/costs/add-cost-modal.tsx` → Use `GenericCrudModal`
- `/src/components/costs/edit-cost-modal.tsx` → Use `GenericCrudModal`
- `/src/components/costs/delete-cost-dialog.tsx` → Use `ConfirmationDialog`
- `/src/components/costs/add-cost-event-type-modal.tsx` → Use `GenericCrudModal`
- `/src/components/costs/edit-cost-event-type-modal.tsx` → Use `GenericCrudModal`
- `/src/components/costs/delete-cost-event-type-dialog.tsx` → Use `ConfirmationDialog`

### People Components (Deprecated)
- `/src/components/people/delete-person-dialog.tsx` → Use `ConfirmationDialog`

### Server Actions (Deprecated)
- `/src/app/actions/costs.ts` → Use `/src/app/actions/costs-migrated.ts`
- `/src/app/actions/people.ts` → Use `/src/app/actions/people-migrated.ts`

## Migration Checklist

When migrating a component:

- [ ] Identify all modal/dialog components to migrate
- [ ] Create configuration objects for each modal
- [ ] Define submit handlers that return proper result format
- [ ] Update parent components to use new modals
- [ ] Migrate server actions to use EntityService
- [ ] Test all CRUD operations
- [ ] Update imports in all files using the components
- [ ] Add deprecation comments to old files
- [ ] Update any TypeScript types as needed
- [ ] Ensure translations are preserved

## Support

For questions or issues during migration:
1. Check the example implementations in `*-migrated.tsx` files
2. Review the shared component source code
3. Ensure all required props are provided
4. Verify server action response format matches expectations