'use server'

import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { getImagesForEntity } from '@/lib/storage'

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

    return { data: item }
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

export async function getItemWithImages(itemId: string, userId: string) {
  try {
    // Get the item with full details
    const item = await prisma.items.findFirst({
      where: {
        id: itemId,
        book: {
          user_id: userId
        }
      },
      include: {
        book: {
          include: {
            book_type: {
              include: {
                field_definitions: {
                  orderBy: { display_order: 'asc' }
                }
              }
            }
          }
        },
        category: true,
        item_attributes: {
          include: {
            field_definitions: true
          }
        },
        item_purchases: true,
        item_sales: true,
        item_locations: true,
        item_incidents: {
          orderBy: { created_at: 'desc' }
        },
        documents: true
      }
    })

    if (!item) {
      return { error: 'Item not found or access denied' }
    }

    // Get images using centralized system
    const images = await getImagesForEntity('item', itemId)

    return {
      item: {
        ...item,
        images: images.map(image => ({
          id: image.id,
          url: image.storage_url || image.file_path,
          file_path: image.file_path,
          file_name: image.file_name,
          original_name: image.original_name,
          file_size: Number(image.file_size || 0),
          mime_type: image.mime_type,
          is_primary: image.is_primary,
          position: image.position || 0,
          title: image.title,
          alt_text: image.alt_text,
          created_at: image.created_at,
          updated_at: image.updated_at
        }))
      }
    }
  } catch (error) {
    console.error('Failed to get item with images:', error)
    return { error: 'Failed to get item' }
  }
}

export async function getItemsWithImages(bookId: string, userId: string) {
  try {
    // Get all items for the book
    const items = await prisma.items.findMany({
      where: {
        book_id: bookId,
        book: {
          user_id: userId
        }
      },
      include: {
        category: true,
        item_purchases: true,
        item_sales: true
      },
      orderBy: { created_at: 'desc' }
    })

    // Get images for each item
    const itemsWithImages = await Promise.all(
      items.map(async (item) => {
        const images = await getImagesForEntity('item', item.id)
        const primaryImage = images.find(img => img.is_primary) || images[0]
        
        return {
          ...item,
          primaryImage: primaryImage ? {
            id: primaryImage.id,
            url: primaryImage.storage_url || primaryImage.file_path,
            alt_text: primaryImage.alt_text,
            title: primaryImage.title
          } : null,
          imageCount: images.length
        }
      })
    )

    return { items: itemsWithImages }
  } catch (error) {
    console.error('Failed to get items with images:', error)
    return { error: 'Failed to get items' }
  }
}

export async function getItemDocuments(itemId: string) {
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

    // Get documents using the centralized documents table
    const documents = await prisma.documents.findMany({
      where: {
        entity_type: 'item',
        entity_id: itemId,
        is_deleted: false
      },
      include: {
        document_type: true
      },
      orderBy: {
        created_at: 'desc'
      }
    })

    return { documents }
  } catch (error) {
    console.error('Failed to get item documents:', error)
    return { error: 'Failed to get item documents' }
  }
}

export async function createItemDocument(
  itemId: string,
  documentTypeId: string,
  title: string,
  filePath: string,
  fileName: string,
  fileSize: number,
  mimeType: string,
  url: string,
  description?: string
) {
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

    // Create document using the centralized documents table
    const document = await prisma.documents.create({
      data: {
        document_type_id: documentTypeId,
        entity_type: 'item',
        entity_id: itemId,
        title,
        original_name: fileName,
        file_name: fileName,
        file_path: filePath,
        file_size: BigInt(fileSize),
        mime_type: mimeType,
        storage_provider: 'supabase',
        storage_url: url,
        description
      },
      include: {
        document_type: true
      }
    })

    revalidatePath('/dashboard/items')
    return { document }
  } catch (error) {
    console.error('Failed to create item document:', error)
    return { error: 'Failed to create item document' }
  }
}

export async function deleteItemDocument(documentId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  try {
    // Get document to verify it belongs to an item owned by the user
    const document = await prisma.documents.findFirst({
      where: { 
        id: documentId,
        entity_type: 'item'
      }
    })

    if (!document) {
      return { error: 'Document not found' }
    }

    // Check if item belongs to user (through book)
    const item = await prisma.items.findFirst({
      where: { id: document.entity_id },
      include: {
        book: true
      }
    })

    if (!item || item.book.user_id !== user.id) {
      return { error: 'Access denied' }
    }

    // Soft delete the document
    await prisma.documents.update({
      where: { id: documentId },
      data: {
        is_deleted: true,
        deleted_at: new Date()
      }
    })

    revalidatePath('/dashboard/items')
    return { success: true }
  } catch (error) {
    console.error('Failed to delete item document:', error)
    return { error: 'Failed to delete item document' }
  }
}

export async function getDocumentTypes() {
  try {
    const documentTypes = await prisma.document_types.findMany({
      orderBy: {
        name: 'asc'
      }
    })

    return { documentTypes }
  } catch (error) {
    console.error('Failed to get document types:', error)
    return { error: 'Failed to get document types' }
  }
}