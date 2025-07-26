'use server'

import { EntityService, ValidationService, SerializationService } from '@/services'
import { revalidatePath } from 'next/cache'

/**
 * Create a new category using the centralized EntityService
 */
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

/**
 * Update an existing category
 */
export async function updateCategory(categoryId: string, formData: FormData) {
  const name = formData.get('name') as string
  
  if (!name || !name.trim()) {
    return { error: 'Category name is required' }
  }
  
  const result = await EntityService.update('category', categoryId, {
    name: name.trim()
  }, {
    revalidatePaths: ['/dashboard/categories', '/dashboard/items']
  })
  
  if (!result.success) {
    return { 
      error: result.validationErrors?.[0] || result.error || 'Failed to update category' 
    }
  }
  
  console.log('Updated category:', result.data)
  
  return { category: result.data }
}

/**
 * Delete a category
 */
export async function deleteCategory(categoryId: string) {
  const result = await EntityService.delete('category', categoryId, {
    revalidatePaths: ['/dashboard/categories']
  })
  
  if (!result.success) {
    return { 
      error: result.validationErrors?.[0] || result.error || 'Failed to delete category' 
    }
  }
  
  return { success: true }
}

/**
 * Get all categories for the current user
 */
export async function getCategories() {
  const result = await EntityService.list('category', {
    orderBy: { name: 'asc' }
  })
  
  if (!result.success) {
    console.error('Failed to get categories:', result.error)
    return []
  }
  
  return result.data || []
}

/**
 * Get a single category by ID
 */
export async function getCategory(categoryId: string) {
  const result = await EntityService.get('category', categoryId)
  
  if (!result.success) {
    return { error: result.error || 'Category not found' }
  }
  
  return { category: result.data }
}