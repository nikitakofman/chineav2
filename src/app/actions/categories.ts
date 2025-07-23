'use server'

import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function createCategory(name: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  if (!name.trim()) {
    return { error: 'Category name is required' }
  }

  try {
    // Check if category already exists for this user
    const existingCategory = await prisma.category.findFirst({
      where: {
        user_id: user.id,
        name: name.trim()
      }
    })

    if (existingCategory) {
      return { error: 'A category with this name already exists' }
    }

    // Create the category
    const category = await prisma.category.create({
      data: {
        user_id: user.id,
        name: name.trim()
      }
    })

    return { category }
  } catch (error) {
    console.error('Failed to create category:', error)
    return { error: 'Failed to create category' }
  }
}

export async function updateCategory(categoryId: string, formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const name = formData.get('name') as string

  if (!name || !name.trim()) {
    return { error: 'Category name is required' }
  }

  try {
    // Check if category belongs to user
    const existing = await prisma.category.findFirst({
      where: {
        id: categoryId,
        user_id: user.id
      }
    })

    if (!existing) {
      return { error: 'Category not found' }
    }

    // Check if another category with the same name exists
    const duplicate = await prisma.category.findFirst({
      where: {
        name: name.trim(),
        user_id: user.id,
        id: { not: categoryId }
      }
    })

    if (duplicate) {
      return { error: 'Another category with this name already exists' }
    }

    const category = await prisma.category.update({
      where: { id: categoryId },
      data: {
        name: name.trim(),
        updated_at: new Date()
      }
    })

    console.log('Updated category:', category)

    revalidatePath('/dashboard/categories')
    revalidatePath('/dashboard/items')
    return { category }
  } catch (error) {
    console.error('Failed to update category:', error)
    return { error: 'Failed to update category' }
  }
}

export async function deleteCategory(categoryId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  try {
    // Check if category belongs to user
    const existing = await prisma.category.findFirst({
      where: {
        id: categoryId,
        user_id: user.id
      }
    })

    if (!existing) {
      return { error: 'Category not found' }
    }

    // Check if category is used by any items
    const itemsCount = await prisma.items.count({
      where: { category_id: categoryId }
    })

    if (itemsCount > 0) {
      return { error: 'Cannot delete category that is being used by items' }
    }

    await prisma.category.delete({
      where: { id: categoryId }
    })

    revalidatePath('/dashboard/categories')
    return { success: true }
  } catch (error) {
    console.error('Failed to delete category:', error)
    return { error: 'Failed to delete category' }
  }
}