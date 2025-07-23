'use server'

import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'

export async function getFieldDefinitionsForBook(bookId: string) {
  const book = await prisma.book.findUnique({
    where: { id: bookId },
    include: {
      book_type: {
        include: {
          field_definitions: {
            orderBy: {
              display_order: 'asc'
            }
          }
        }
      }
    }
  })

  if (!book || !book.book_type) {
    return []
  }

  return book.book_type.field_definitions
}

export async function createItem(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const bookId = formData.get('bookId') as string
  const itemNumber = formData.get('itemNumber') as string
  const description = formData.get('description') as string
  const categoryId = formData.get('categoryId') as string
  const color = formData.get('color') as string
  const grade = formData.get('grade') as string
  const purchasePrice = formData.get('purchasePrice') as string
  const purchaseDate = formData.get('purchaseDate') as string

  try {
    // Create the item
    const item = await prisma.items.create({
      data: {
        book_id: bookId,
        item_number: itemNumber,
        description,
        category_id: categoryId || null,
        color,
        grade
      }
    })

    // Create purchase record if price or date provided
    if (purchasePrice || purchaseDate) {
      await prisma.item_purchases.create({
        data: {
          item_id: item.id,
          purchase_price: purchasePrice ? parseFloat(purchasePrice) : null,
          purchase_date: purchaseDate ? new Date(purchaseDate) : null
        }
      })
    }

    // Get all field definitions to process custom fields
    const fieldDefinitions = await getFieldDefinitionsForBook(bookId)
    
    // Process custom field values
    for (const fieldDef of fieldDefinitions) {
      const value = formData.get(`field_${fieldDef.id}`) as string
      if (value) {
        await prisma.item_attributes.create({
          data: {
            item_id: item.id,
            field_definition_id: fieldDef.id,
            value
          }
        })
      }
    }

    return { item }
  } catch (error) {
    console.error('Failed to create item:', error)
    return { error: 'Failed to create item' }
  }
}

export async function getCategories(userId: string) {
  return prisma.category.findMany({
    where: { user_id: userId },
    orderBy: { name: 'asc' }
  })
}

export async function updateItemCategory(itemId: string, categoryId: string | null) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  try {
    // Check if item belongs to user (through book)
    const item = await prisma.items.findFirst({
      where: { id: itemId },
      include: {
        book: true
      }
    })

    if (!item || item.book.user_id !== user.id) {
      return { error: 'Item not found or access denied' }
    }

    // Update the item category
    const updatedItem = await prisma.items.update({
      where: { id: itemId },
      data: {
        category_id: categoryId,
        updated_at: new Date()
      }
    })

    revalidatePath('/dashboard/items')
    return { item: updatedItem }
  } catch (error) {
    console.error('Failed to update item category:', error)
    return { error: 'Failed to update item category' }
  }
}